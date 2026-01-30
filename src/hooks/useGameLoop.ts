import { useEffect, useRef, type RefObject, type MutableRefObject } from 'react';
import type { Customer, Coworker, Desk, Player } from '../types/game';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const MOBILE_CANVAS_WIDTH = 400;
const MOBILE_CANVAS_HEIGHT = 800;
const MIN_WAITING_CUSTOMERS = 1;
const MAX_WAITING_CUSTOMERS = 5;
const STEAL_INTERVAL_MIN = 20;
const STEAL_INTERVAL_MAX = 45;
const COWORKER_DEAL_MIN = 60;
const COWORKER_DEAL_MAX = 120;

export interface UseGameLoopParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isMobile: boolean;
  gameState: string;
  customersRef: MutableRefObject<Customer[]>;
  coworkersRef: MutableRefObject<Coworker[]>;
  desksRef: MutableRefObject<Desk[]>;
  playerRef: MutableRefObject<Player>;
  showInput: boolean;
  selectedPerson: Customer | null;
  spawnNewCustomer: () => void;
}

export function useGameLoop({
  canvasRef,
  isMobile,
  gameState,
  customersRef,
  coworkersRef,
  desksRef,
  playerRef,
  showInput,
  selectedPerson,
  spawnNewCustomer,
}: UseGameLoopParams): void {
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetWidth = isMobile ? MOBILE_CANVAS_WIDTH : CANVAS_WIDTH;
    const targetHeight = isMobile ? MOBILE_CANVAS_HEIGHT : CANVAS_HEIGHT;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deskImg = new Image();
    deskImg.src = new URL('../../Assets/desk.png', import.meta.url).href;

    const animate = () => {
      const uiScale = isMobile ? 1.75 : 1;
      const player = playerRef.current;

      type GameEntity = Player | Coworker | Customer;
      const entities: GameEntity[] = [
        player,
        ...coworkersRef.current,
        ...customersRef.current.filter((c) => c.active),
      ];

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i];
          const e2 = entities[j];
          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = 35;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            const moveX = (nx * overlap) / 2;
            const moveY = (ny * overlap) / 2;
            const isE1Static = 'type' in e1 && e1.type === 'coworker';
            const isE2Static = 'type' in e2 && e2.type === 'coworker';
            if ('type' in e1 && e1.type === 'coworker' && 'type' in e2 && e2.type === 'customer' && e1.workingWithCustomerId === e2.id) continue;
            if ('type' in e2 && e2.type === 'coworker' && 'type' in e1 && e1.type === 'customer' && e2.workingWithCustomerId === e1.id) continue;
            if (isE1Static && !isE2Static) {
              e2.x += moveX * 2;
              e2.y += moveY * 2;
            } else if (!isE1Static && isE2Static) {
              e1.x -= moveX * 2;
              e1.y -= moveY * 2;
            } else if (!isE1Static && !isE2Static) {
              e1.x -= moveX;
              e1.y -= moveY;
              e2.x += moveX;
              e2.y += moveY;
            }
          }
        }
      }

      const pdx = player.targetX - player.x;
      const pdy = player.targetY - player.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pdist > 2) {
        player.x += (pdx / pdist) * player.speed;
        player.y += (pdy / pdist) * player.speed;
      }

      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const entranceX = isMobile ? MOBILE_CANVAS_WIDTH / 2 - 30 : 380;
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(entranceX, 0, 60, 20);
      ctx.fillStyle = '#666';
      ctx.font = `${12 * uiScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('ENTRANCE', entranceX + 30, 35);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }


      desksRef.current.forEach((desk) => {
        if (deskImg.complete && deskImg.naturalWidth > 0) {
          ctx.drawImage(deskImg, desk.x, desk.y, desk.w, desk.h);
        } else {
          // Fallback rendering while loading - DEBUG RED
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(desk.x, desk.y, desk.w, desk.h);
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 2;
          ctx.strokeRect(desk.x, desk.y, desk.w, desk.h);
        }
      });

      coworkersRef.current.forEach((coworker) => {
        const isWorking = coworker.workingWithCustomerId !== undefined;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(coworker.x, coworker.y + 20, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = coworker.color;
        ctx.beginPath();
        ctx.arc(coworker.x, coworker.y, 15, 0, Math.PI * 2);
        ctx.fill();
        if (!isWorking) {
          const titleWidth = ctx.measureText(coworker.title).width + 10;
          ctx.fillStyle = coworker.color;
          ctx.fillRect(coworker.x - titleWidth / 2, coworker.y - 48, titleWidth, 14);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${9 * uiScale}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(coworker.title, coworker.x, coworker.y - 37);
        }
        ctx.fillStyle = '#000';
        ctx.font = `bold ${11 * uiScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(coworker.name, coworker.x, coworker.y - 22);
      });

      customersRef.current.forEach((customer) => {
        if (!customer.active) return;
        const distToPlayer = Math.sqrt(Math.pow(player.x - customer.x, 2) + Math.pow(player.y - customer.y, 2));
        const isNearby = distToPlayer < 80;
        const isStolen = customer.isStolen;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(customer.x, customer.y + 20, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isStolen ? '#888' : customer.color;
        ctx.beginPath();
        ctx.arc(customer.x, customer.y, 15, 0, Math.PI * 2);
        ctx.fill();
        if (!isStolen) {
          const barWidth = 30;
          const barHeight = 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(customer.x - barWidth / 2, customer.y + 25, barWidth, barHeight);
          ctx.fillStyle = customer.interest > 60 ? '#2ecc71' : customer.interest > 30 ? '#f39c12' : '#e74c3c';
          ctx.fillRect(customer.x - barWidth / 2, customer.y + 25, (customer.interest / 100) * barWidth, barHeight);
        }
        const nameParts = customer.name.split(' ');
        const displayName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : nameParts[0];
        ctx.fillStyle = isStolen ? '#999' : '#000';
        ctx.font = `bold ${11 * uiScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(displayName, customer.x, customer.y - 25);
        if (isStolen) {
          const badgeWidth = 50;
          const badgeHeight = 14;
          ctx.fillStyle = '#c0392b';
          ctx.beginPath();
          ctx.roundRect(customer.x - badgeWidth / 2, customer.y - 53, badgeWidth, badgeHeight, 7);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${9 * uiScale}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('TAKEN', customer.x, customer.y - 43);
        } else {
          ctx.fillStyle = customer.buyerType === 'cash' ? '#2ecc71' : '#3498db';
          ctx.fillRect(customer.x - 25, customer.y - 52, 50, 12);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${8 * uiScale}px Arial`;
          ctx.fillText(customer.buyerType.toUpperCase(), customer.x, customer.y - 43);
        }
        if (isNearby && !showInput && !isStolen) {
          const buttonX = customer.x - 30;
          const buttonY = customer.y + 35;
          const buttonW = 60 * uiScale;
          const buttonH = 20 * uiScale;
          customer.buttonBounds = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };
          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(buttonX, buttonY, buttonW, buttonH);
          ctx.strokeStyle = '#27ae60';
          ctx.lineWidth = 2;
          ctx.strokeRect(buttonX, buttonY, buttonW, buttonH);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${11 * uiScale}px Arial`;
          ctx.fillText('TALK', customer.x, buttonY + 14 * uiScale);
        } else {
          customer.buttonBounds = null;
        }
      });

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 20, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${11 * uiScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('YOU', player.x, player.y - 25);

      const deltaTime = 1 / 60;
      customersRef.current.forEach((customer) => {
        if (!customer.active) return;
        const isBeingHelped = customer.isStolen || customer.conversationPhase !== 'greeting';
        if (!isBeingHelped) {
          customer.unattendedTimer += deltaTime;
          if (customer.unattendedTimer >= 60) {
            customer.active = false;
            customer.isLost = true;
            customersRef.current = customersRef.current.filter((c) => c.id !== customer.id);
          }
        } else {
          customer.unattendedTimer = 0;
        }
      });

      const waitingCount = customersRef.current.filter(
        (c) => c.active && !c.isStolen && c.conversationPhase === 'greeting'
      ).length;
      if (waitingCount < MIN_WAITING_CUSTOMERS && waitingCount < MAX_WAITING_CUSTOMERS) {
        spawnNewCustomer();
      }

      const salesCoworkers = coworkersRef.current.filter((c) => c.department === 'sales');
      salesCoworkers.forEach((coworker) => {
        if (coworker.nextStealTime === undefined) {
          coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
        }
        if (coworker.pendingCustomerSpawn !== undefined && coworker.pendingCustomerSpawn > 0) {
          coworker.pendingCustomerSpawn -= deltaTime;
          if (coworker.pendingCustomerSpawn <= 0) {
            coworker.pendingCustomerSpawn = undefined;
            spawnNewCustomer();
          }
        }
        if (coworker.workingWithCustomerId !== undefined) {
          const customer = customersRef.current.find((c) => c.id === coworker.workingWithCustomerId);
          if (!customer || !customer.active) {
            coworker.workingWithCustomerId = undefined;
            coworker.workingTimer = 0;
            coworker.stealPhase = undefined;
            coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
            return;
          }
          if (customer) {
            if (coworker.stealPhase === 'walking') {
              const dx = customer.x - coworker.x;
              const dy = customer.y - coworker.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 15) {
                const speed = 2.5;
                coworker.x += (dx / dist) * speed;
                coworker.y += (dy / dist) * speed;
                const isIntercepted = showInput && selectedPerson?.id === customer.id;
                if (isIntercepted || !customer.active || customer.isLost) {
                  coworker.stealPhase = 'returning';
                  coworker.workingWithCustomerId = undefined;
                  coworker.nextStealTime = STEAL_INTERVAL_MIN;
                  coworker.pendingCustomerSpawn = undefined;
                }
              } else {
                const isIntercepted = showInput && selectedPerson?.id === customer.id;
                if (isIntercepted) {
                  coworker.stealPhase = 'returning';
                  coworker.workingWithCustomerId = undefined;
                  coworker.nextStealTime = STEAL_INTERVAL_MIN;
                  coworker.pendingCustomerSpawn = undefined;
                } else {
                  customer.isStolen = true;
                  customer.stolenByCoworkerId = coworker.id;
                  customer.stolenDealTimer = 0;
                  customer.stolenDealDuration = COWORKER_DEAL_MIN + Math.random() * (COWORKER_DEAL_MAX - COWORKER_DEAL_MIN);
                  coworker.stealPhase = 'greeting';
                  coworker.workingTimer = 0;
                }
              }
            } else if (coworker.stealPhase === 'greeting') {
              coworker.workingTimer = (coworker.workingTimer || 0) + deltaTime;
              if (coworker.workingTimer >= 1.5) {
                coworker.stealPhase = 'returning';
                coworker.workingTimer = 0;
              }
            } else if (coworker.stealPhase === 'returning') {
              const targetX = coworker.originalX || 0;
              const targetY = coworker.originalY || 0;
              const dx = targetX - coworker.x;
              const dy = targetY - coworker.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 5) {
                const speed = 2.5;
                coworker.x += (dx / dist) * speed;
                coworker.y += (dy / dist) * speed;
                const custTargetX = coworker.x;
                const custTargetY = coworker.y + 45;
                const cdx = custTargetX - customer.x;
                const cdy = custTargetY - customer.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cdist > 5) {
                  customer.x += (cdx / cdist) * speed;
                  customer.y += (cdy / cdist) * speed;
                }
              } else {
                coworker.x = targetX;
                coworker.y = targetY;
                customer.x = targetX;
                customer.y = targetY - 55;
                coworker.stealPhase = 'working';
                coworker.workingTimer = 0;
              }
            } else if (coworker.stealPhase === 'working') {
              coworker.workingTimer = (coworker.workingTimer || 0) + deltaTime;
              customer.x = coworker.originalX ?? coworker.x;
              customer.y = (coworker.originalY ?? coworker.y) - 55;
              customer.stolenDealTimer = (customer.stolenDealTimer || 0) + deltaTime;
              if (customer.stolenDealDuration && customer.stolenDealTimer >= customer.stolenDealDuration) {
                const coinToss = Math.random();
                if (coinToss >= 0.5) {
                  customer.active = false;
                  customer.conversationPhase = 'closed';
                } else {
                  customer.active = false;
                  customer.isLost = true;
                  customer.conversationPhase = 'closed';
                }
                coworker.workingWithCustomerId = undefined;
                coworker.workingTimer = 0;
                coworker.stealPhase = undefined;
                coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
                customer.isStolen = false;
                customer.stolenByCoworkerId = undefined;
                customer.stolenDealTimer = undefined;
                customer.stolenDealDuration = undefined;
                customersRef.current = customersRef.current.filter((c) => c.id !== customer.id);
              }
              const pencilBob = Math.sin(Date.now() / 200) * 3;
              ctx.save();
              ctx.translate(coworker.originalX ?? coworker.x, (coworker.originalY ?? coworker.y) - 30 + pencilBob);
              ctx.fillStyle = '#f1c40f';
              ctx.fillRect(-3, -10, 6, 16);
              ctx.fillStyle = '#e74c3c';
              ctx.fillRect(-3, -10, 6, 4);
              ctx.fillStyle = '#2c3e50';
              ctx.beginPath();
              ctx.moveTo(-3, 6);
              ctx.lineTo(0, 12);
              ctx.lineTo(3, 6);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          coworker.nextStealTime! -= deltaTime;
          if (coworker.nextStealTime! <= 0) {
            const availableCustomers = customersRef.current.filter(
              (c) =>
                c.active &&
                !c.isStolen &&
                c.conversationPhase === 'greeting' &&
                !(showInput && selectedPerson?.id === c.id)
            );
            if (availableCustomers.length > 0) {
              const victim = availableCustomers[Math.floor(Math.random() * availableCustomers.length)];
              coworker.workingWithCustomerId = victim.id;
              coworker.workingTimer = 0;
              coworker.stealPhase = 'walking';
              coworker.pendingCustomerSpawn = 3 + Math.random() * 2;
            } else {
              coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameState, isMobile, showInput, selectedPerson?.id, spawnNewCustomer]);
}
