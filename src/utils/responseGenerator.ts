import type { Car, Customer, PersonalityType, DesiredFeature, VehicleCategory, ConversationPhase, AIConversationMessage, GameSettings, Sentiment } from '../types/game';

const AI_RESPONSE_MAX_TOKENS = 512;

// ============ VEHICLE CATEGORY LABELS ============
const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  suv: 'an SUV',
  sedan: 'a sedan',
  electric: 'an electric car',
  hybrid: 'a hybrid',
  affordable: 'something affordable',
  luxury: 'something luxury',
  any: '', // Not used directly, handled separately
};



// ============ GREETING RESPONSES ============
// Customer responds with what they're looking for

const GREETING_RESPONSES: Record<PersonalityType, (features: DesiredFeature[], customer: Customer) => string[]> = {
  friendly: (_features, customer) => [
    `Hi there! I'm looking for ${CATEGORY_LABELS[customer.desiredCategory]} and hoping to spend around $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `Hello! Can you help me find ${CATEGORY_LABELS[customer.desiredCategory]}? My budget is roughly $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `Hi! I need a car today. I'm looking for ${CATEGORY_LABELS[customer.desiredCategory]} under $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
  ],
  serious: (_features, customer) => [
    `I'm in the market for ${CATEGORY_LABELS[customer.desiredCategory]}. Max limit: $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `Hello. Show me ${CATEGORY_LABELS[customer.desiredCategory]} inventory. I will not exceed $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `Hi. I need to buy ${CATEGORY_LABELS[customer.desiredCategory]} today. Budget cap is $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
  ],
  skeptical: (_features, customer) => [
    `Look, I just need ${CATEGORY_LABELS[customer.desiredCategory]}. Don't try to go over $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `I'm lookin' for ${CATEGORY_LABELS[customer.desiredCategory]}, but I'm not playing games. $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'} is my limit.`,
    `Yeah, I need ${CATEGORY_LABELS[customer.desiredCategory]}. Just keep it under $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
  ],
  enthusiastic: (_features, customer) => [
    `Hi!! I'm so excited to get ${CATEGORY_LABELS[customer.desiredCategory]} today! I have $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'} to spend!`,
    `Hello! I can't wait to see your ${CATEGORY_LABELS[customer.desiredCategory]}s! I can afford about $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}!`,
    `Hey! I'm ready to drive home in ${CATEGORY_LABELS[customer.desiredCategory]}! My budget is $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}!`,
  ],
  analytical: (_features, customer) => [
    `I am seeking ${CATEGORY_LABELS[customer.desiredCategory]} with a strict financial ceiling of $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `Hello. parameters: ${CATEGORY_LABELS[customer.desiredCategory]}, maximum execution price $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
    `Hi. I'm looking for ${CATEGORY_LABELS[customer.desiredCategory]} that meets my criteria of $${customer.buyerType === 'cash' ? customer.budget.toLocaleString() : customer.maxPayment + '/mo'}.`,
  ],
};

// ============ CAR SHOWN RESPONSES (NO PRICE) ============
// Customer reacts to the car itself, not the price

const CAR_REACTION_POSITIVE: Record<PersonalityType, string[]> = {
  friendly: [
    "Oh wow, I love this color! This looks really nice.",
    "This is exactly what I had in mind! I can see my family in this.",
    "The interior is beautiful! Tell me more about this one.",
  ],
  serious: [
    "Good. This meets my requirements. Let's talk numbers.",
    "Acceptable. What are we looking at price-wise?",
    "This could work. What's the damage?",
  ],
  skeptical: [
    "Hmm, not bad actually. What are you going to try to charge me?",
    "Okay, I'll admit this looks decent. What's the price?",
    "It's alright. So what kind of numbers are we talking?",
  ],
  enthusiastic: [
    "OH WOW! I LOVE IT! This is PERFECT! How much?!",
    "This is amazing! I'm in love! What's the price?!",
    "YES! This is exactly what I wanted! Let's talk numbers!",
  ],
  analytical: [
    "Good specs. Fuel economy looks acceptable. What's the pricing structure?",
    "This matches my requirements. Show me the breakdown.",
    "Interesting. The features align with my needs. Let's discuss price.",
  ],
};

const CAR_REACTION_NEGATIVE: Record<PersonalityType, string[]> = {
  friendly: [
    "It's nice, but not quite what I'm looking for. Got anything else?",
    "Hmm, I'm not feeling this one. Can you show me something different?",
    "Not exactly what I had in mind. What else do you have?",
  ],
  serious: [
    "No. This doesn't work. Next.",
    "Not what I need. Show me something else.",
    "Wrong fit. What else do you have?",
  ],
  skeptical: [
    "Nope, not buying it. Literally. Show me something better.",
    "This isn't it. What are you hiding that's actually good?",
    "Pass. Got anything that actually fits what I said?",
  ],
  enthusiastic: [
    "Ooh, this is nice but not quite right! Show me another one!",
    "I like it but... not THE one, you know? What else?",
    "Almost! But can you show me something more like what I described?",
  ],
  analytical: [
    "This doesn't match my criteria. Show me alternatives.",
    "Specifications don't align. I need something different.",
    "Negative. This fails to meet requirements. Next option please.",
  ],
};




const DISCOVERY_RESPONSES = {
  budget: {
    friendly: (c: Customer) => c.buyerType === 'cash' 
      ? [`I'm hoping to stay around $${c.budget.toLocaleString()}.`, `My budget is somewhere around $${c.budget.toLocaleString()}.`]
      : [`I have about $${c.desiredDown.toLocaleString()} down and want to pay around $${c.maxPayment}/mo.`, `Looking for payments around $${c.maxPayment}/mo with $${c.desiredDown.toLocaleString()} down.`],
    serious: (c: Customer) => c.buyerType === 'cash'
      ? [`My budget cap is $${c.budget.toLocaleString()}.`, `I will not exceed $${c.budget.toLocaleString()}.`]
      : [`Max payment: $${c.maxPayment}/mo. Down payment: $${c.desiredDown.toLocaleString()}.`, `Detailed financials: $${c.desiredDown.toLocaleString()} down, $${c.maxPayment}/mo max.`],
    skeptical: (c: Customer) => c.buyerType === 'cash'
      ? [`I'm not spending a dime over $${c.budget.toLocaleString()}.`, `Under $${c.budget.toLocaleString()}. That's it.`]
      : [`I've got $${c.desiredDown.toLocaleString()} down. Don't try to go over $${c.maxPayment}/mo.`, `$${c.maxPayment}/mo is my hard limit.`],
    enthusiastic: (c: Customer) => c.buyerType === 'cash'
      ? [`I have $${c.budget.toLocaleString()} to spend today!`, `I'm ready to buy if it's under $${c.budget.toLocaleString()}!`]
      : [`I saved up $${c.desiredDown.toLocaleString()} for a down payment! Ideally $${c.maxPayment}/mo!`, `I can do about $${c.maxPayment}/mo!`],
    analytical: (c: Customer) => c.buyerType === 'cash'
      ? [`Calculated budget ceiling: $${c.budget.toLocaleString()}.`, `Financial limit set at $${c.budget.toLocaleString()}.`]
      : [`Cash flow allows for $${c.maxPayment}/mo with initial capital of $${c.desiredDown.toLocaleString()}.`, `Financial parameters: $${c.desiredDown.toLocaleString()} down, $${c.maxPayment}/mo max.`],
  },
  type: {
    friendly: (c: Customer) => c.desiredCategory === 'any' 
      ? ["I'm honestly open to anything reliable!", "I'm not sure, maybe you can recommend something?"]
      : [`I'm really looking for ${CATEGORY_LABELS[c.desiredCategory]}.`, `I'd love to see ${CATEGORY_LABELS[c.desiredCategory]}.`],
    serious: (c: Customer) => c.desiredCategory === 'any'
      ? ["I need a reliable vehicle. The type matters less than the value.", "Show me your best options. I'm flexible."]
      : [`I need ${CATEGORY_LABELS[c.desiredCategory]}.`, `Show me ${CATEGORY_LABELS[c.desiredCategory]}s only.`],
    skeptical: (c: Customer) => c.desiredCategory === 'any'
      ? ["Just show me something that runs well.", "I don't care about the type, just the price."]
      : [`I'm only interested in ${CATEGORY_LABELS[c.desiredCategory]}.`, `Don't show me anything that isn't ${CATEGORY_LABELS[c.desiredCategory]}.`],
    enthusiastic: (c: Customer) => c.desiredCategory === 'any'
      ? ["I'm open to anything! Surprise me!", "I just want a cool new car! What do you have?"]
      : [`I've always wanted ${CATEGORY_LABELS[c.desiredCategory]}!`, `Show me your coolest ${CATEGORY_LABELS[c.desiredCategory]}!`],
    analytical: (c: Customer) => c.desiredCategory === 'any'
      ? ["Vehicle category is secondary to performance metrics.", "I am evaluating all vehicle segments."]
      : [`My analysis points to ${CATEGORY_LABELS[c.desiredCategory]} as the optimal form factor.`, `Requirement: ${CATEGORY_LABELS[c.desiredCategory]}.`],
  },
  features: {
    friendly: (c: Customer) => [`I'd really like something ${formatFeatures(c.desiredFeatures)}.`, `Ideally it would be ${formatFeatures(c.desiredFeatures)}.`],
    serious: (c: Customer) => [`Must have: ${formatFeatures(c.desiredFeatures)}.`, `Requirements: ${formatFeatures(c.desiredFeatures)}.`],
    skeptical: (c: Customer) => [`It better be ${formatFeatures(c.desiredFeatures)}.`, `I just need it to be ${formatFeatures(c.desiredFeatures)}.`],
    enthusiastic: (c: Customer) => [`I want something ${formatFeatures(c.desiredFeatures)}!`, `It has to be ${formatFeatures(c.desiredFeatures)}!`],
    analytical: (c: Customer) => [`Required specifications: ${formatFeatures(c.desiredFeatures)}.`, `Feature set must include: ${formatFeatures(c.desiredFeatures)}.`],
  },
  model: {
    friendly: (c: Customer) => c.desiredModel 
      ? [`I saw the ${c.desiredModel} online and liked it!`, `Do you have any ${c.desiredModel}s?`] 
      : ["I don't have a specific model in mind.", "I'm open to suggestions on the model."],
    serious: (c: Customer) => c.desiredModel
      ? [`I am here for the ${c.desiredModel}.`, `Show me the ${c.desiredModel}.`]
      : ["No specific model preference. Quality is key.", "I'll evaluate the models you have."],
    skeptical: (c: Customer) => c.desiredModel
      ? [`I'm looking for a ${c.desiredModel}. Do you actually have any?`, `I want a ${c.desiredModel}.`]
      : ["I don't care about the nameplate.", "Just show me what you got."],
    enthusiastic: (c: Customer) => c.desiredModel
      ? [`I LOVE the ${c.desiredModel}! Do you have one?!`, `Is there a ${c.desiredModel} here?!`]
      : ["I don't know specifically! Show me everything!", "I'm just excited to see what's new!"],
    analytical: (c: Customer) => c.desiredModel
      ? [`The ${c.desiredModel} rates highly in my research.`, `I am targeting the ${c.desiredModel}.`]
      : ["Model selection will be based on comparative data.", "No specific model bias."],
  }
};

// ============ DIFFICULT CUSTOMER EVASIVE RESPONSES ============
// These customers refuse to share preferences - player must guess
const DIFFICULT_CUSTOMER_RESPONSES = {
  budget: {
    friendly: () => ["I'd rather not say exactly... just show me what you have.", "Oh, I'm flexible on price. Let's just see what's available."],
    serious: () => ["That's my business. Show me the cars.", "I'll tell you if it's too expensive. Move on."],
    skeptical: () => ["Why do you need to know? So you can charge me more?", "None of your business. Just show me cars."],
    enthusiastic: () => ["Let's not worry about that yet! I want to see what you have!", "Money talk later! Show me cars!"],
    analytical: () => ["I prefer not to anchor the negotiation. Proceed.", "That information is classified for now."],
  },
  type: {
    friendly: () => ["I'm not really sure, honestly. What do you recommend?", "I don't know, maybe you can figure it out!"],
    serious: () => ["Just show me your best vehicles.", "I'll know it when I see it."],
    skeptical: () => ["Why should I tell you? Just show me everything.", "Does it matter? I'm the customer here."],
    enthusiastic: () => ["Surprise me! I'm open to anything!", "I'll know when I see it! Show me stuff!"],
    analytical: () => ["I'm evaluating multiple categories. That's all you need to know.", "Data gathering phase. Show me options."],
  },
  features: {
    friendly: () => ["Oh, just something nice I guess?", "I'm not really sure what I need... maybe you can help?"],
    serious: () => ["I have my requirements. You'll see if you meet them.", "Stop asking questions and show me cars."],
    skeptical: () => ["I'm not giving you a checklist to upsell me.", "That's for me to know."],
    enthusiastic: () => ["I want it all! Just show me cool stuff!", "Everything! Or anything! Whatever!"],
    analytical: () => ["My criteria are confidential. Present your inventory.", "Feature requirements are undisclosed."],
  },
  model: {
    friendly: () => ["I haven't decided yet, maybe you can help!", "Not really set on anything specific..."],
    serious: () => ["Show me what you have. I'll decide.", "That's not relevant. Show me the lot."],
    skeptical: () => ["So you can tell me it's sold? Just show me what's here.", "I'm not telling you that."],
    enthusiastic: () => ["I don't know! What's cool?!", "Surprise me!"],
    analytical: () => ["Model selection is pending further data collection.", "TBD based on comparative analysis."],
  }
};

// ============ NEGOTIATION RESPONSES ============

const OFFER_TOO_HIGH: Record<PersonalityType, (counterOffer: number, isPayment: boolean, desiredDown?: number) => string[]> = {
  friendly: (counter, isPayment, desiredDown) => [
    isPayment && desiredDown 
      ? `That's a bit steep for me. I'm putting $${desiredDown.toLocaleString()} down and I need to be at $${counter}/month.`
      : `That's a bit steep for me. I was thinking more like $${counter.toLocaleString()} out the door.`,
    isPayment && desiredDown
      ? `Ooh, that's higher than I hoped. With $${desiredDown.toLocaleString()} down, I can only do $${counter}/month.`
      : `Ooh, that's higher than I hoped. Could you do $${counter.toLocaleString()}?`,
    isPayment && desiredDown
      ? `I appreciate it, but that's too high. I have $${desiredDown.toLocaleString()} for down payment and max $${counter}/month.`
      : `I appreciate it, but that's too high. What about $${counter.toLocaleString()} total?`,
  ],
  serious: (counter, isPayment, desiredDown) => [
    isPayment && desiredDown
      ? `No. $${desiredDown.toLocaleString()} down, $${counter}/month. That's my number.`
      : `No. $${counter.toLocaleString()} out the door. That's my number.`,
    isPayment && desiredDown
      ? `Too high. I'm putting $${desiredDown.toLocaleString()} down. Get me to $${counter}/month.`
      : `Too high. I'll do $${counter.toLocaleString()}.`,
    isPayment && desiredDown
      ? `My offer: $${desiredDown.toLocaleString()} down, $${counter} monthly. Take it or leave it.`
      : `My offer: $${counter.toLocaleString()} OTD. Final.`,
  ],
  skeptical: (counter, isPayment, desiredDown) => [
    isPayment && desiredDown
      ? `I knew it. That's ridiculous. I have $${desiredDown.toLocaleString()} to put down and cap of $${counter}/month.`
      : `I knew it. That's ridiculous. I'll do $${counter.toLocaleString()}, max.`,
    isPayment && desiredDown
      ? `Way too much. I've done my research. $${desiredDown.toLocaleString()} down, $${counter}/month.`
      : `Way too much. I've done my research. $${counter.toLocaleString()} out the door.`,
    isPayment && desiredDown
      ? `Yeah, no. With my $${desiredDown.toLocaleString()} down, fair payment is $${counter}/month.`
      : `Yeah, no. Try $${counter.toLocaleString()}. That's fair market value.`,
  ],
  enthusiastic: (counter, isPayment, desiredDown) => [
    isPayment && desiredDown
      ? `Oh no! That's more than I can do! I have $${desiredDown.toLocaleString()} for down! Can we get to $${counter}/month? Please?`
      : `Oh no! That's more than I can do! Can we try $${counter.toLocaleString()}? Please?`,
    isPayment && desiredDown
      ? `Aww man! I really want this but I can only put $${desiredDown.toLocaleString()} down and afford $${counter}/month!`
      : `Aww man! I really want this but I can only do $${counter.toLocaleString()}!`,
    isPayment && desiredDown
      ? `That's tough! Help me out! $${desiredDown.toLocaleString()} down and $${counter}/month is my max!`
      : `That's tough! Help me out! I can swing $${counter.toLocaleString()} total!`,
  ],
  analytical: (counter, isPayment, desiredDown) => [
    isPayment && desiredDown
      ? `That exceeds my budget. Parameters: $${desiredDown.toLocaleString()} down, max $${counter}/month.`
      : `That exceeds market value by 12%. My counter: $${counter.toLocaleString()}.`,
    isPayment && desiredDown
      ? `Based on my finances: $${desiredDown.toLocaleString()} down payment available, $${counter}/month maximum.`
      : `Based on depreciation data, fair value is $${counter.toLocaleString()} OTD.`,
    isPayment && desiredDown
      ? `Offer parameters: $${desiredDown.toLocaleString()} capital, $${counter} monthly installment. Final.`
      : `Overpriced. Comparable vehicles average $${counter.toLocaleString()}. That's my offer.`,
  ],
};

const CAVE_RESPONSES: Record<PersonalityType, string[]> = {
  friendly: [
      "You know what? You've been so patient with me. I'll do it.",
      "Alright, alright. I really want this car. Let's make it work.",
      "Okay, I'm tired of arguing. That's a deal."
  ],
  serious: [
      "Fine. Market research suggests this is as good as it gets. Agreed.",
      "I've analyzed the situation. Your offer is acceptable. Proceed.",
      "Understood. I will accept these terms to conclude the transaction."
  ],
  skeptical: [
      "Ugh, fine. I guess you're not budging. I'll take it.",
      "Whatever. I'm over it. I'll sign the papers.",
      "You win. I need a car and this one works. Fine."
  ],
  enthusiastic: [
      "OMG OKAY! I just want to drive it home so bad! DEAL!",
      "YAY! I'm so excited! Let's just do it! I want the car!!",
      "I CAN'T WAIT! Okay, you got me! Let's sign!!"
  ],
  analytical: [
      "Incremental gains are decreasing. Accepting current offer state.",
      "Decision: Accept. Opportunity cost of further negotiation exceeds potential savings.",
      "Terms acknowledged. Moving to execution phase."
  ],
};

const PERSISTENCE_PUSHBACK: Record<PersonalityType, string[]> = {
  friendly: [
      "I'm sorry, I already said I can't quite do that yet.",
      "We're still stuck on the same numbers. Is there anything else you can do?",
      "I'd really love to buy from you, but you need to meet me somewhere."
  ],
  serious: [
      "We are repeating ourselves. This is not productive.",
      "You haven't changed your position. Neither will I.",
      "State a new offer or this interaction is over."
  ],
  skeptical: [
      "Are you even listening? I'm not doing that deal.",
      "You're just repeating the same thing. Stop wasting my time.",
      "Don't play games. Give me a better number or I'm out."
  ],
  enthusiastic: [
      "Aww, but I already told you that doesn't work! Please help me out!",
      "Why are we still here? Can't we just find a better way?",
      "This is starting to be not fun! Let's get to a deal!"
  ],
  analytical: [
      "Redundancy detected. No new data provided in offer.",
      "Current iteration cycle is producing zero variance. Terminate or adjust.",
      "Inefficient process. Move to new parameters immediately."
  ],
};


const DOWN_PAYMENT_REJECTION: Record<PersonalityType, (offeredDown: number, desiredDown: number) => string[]> = {
  friendly: (offered, desired) => [
    `Oh, I can't put $${offered.toLocaleString()} down! I only have $${desired.toLocaleString()} saved up.`,
    `That down payment is too high for me. I can only do $${desired.toLocaleString()}.`,
    `I wish I could put $${offered.toLocaleString()} down, but I'm limited to $${desired.toLocaleString()}.`
  ],
  serious: (offered, desired) => [
    `No. The down payment is $${desired.toLocaleString()}. Not $${offered.toLocaleString()}.`,
    `I told you, I have $${desired.toLocaleString()} to put down. Fix it.`,
    `That's too much cash upfront. MAX down payment is $${desired.toLocaleString()}.`
  ],
  skeptical: (offered, desired) => [
    `Trying to drain my bank account? I said I have $${desired.toLocaleString()} down.`,
    `I'm not putting $${offered.toLocaleString()} down. $${desired.toLocaleString()} is my limit.`,
    `Are you listening? $${desired.toLocaleString()} is all I'm putting down.`
  ],
  enthusiastic: (_offered, desired) => [
    `Oh no! I don't have that much cash! I only have $${desired.toLocaleString()}!`,
    `That's way too much for me to put down! I can only do $${desired.toLocaleString()}!`,
    `Aww, I can't afford that down payment! I have $${desired.toLocaleString()} ready!`
  ],
  analytical: (offered, desired) => [
    `Negative. Liquid capital limited to $${desired.toLocaleString()}.`,
    `Down payment of $${offered.toLocaleString()} is not feasible. Limit: $${desired.toLocaleString()}.`,
    `Adjust parameters. Maximum down payment avaliable: $${desired.toLocaleString()}.`
  ],
};

const OFFER_CLOSE: Record<PersonalityType, string[]> = {
  friendly: [
    "We're getting close! Can you come down just a little more?",
    "Almost there! Just a bit more and we have a deal!",
    "That's better! One more small adjustment?",
  ],
  serious: [
    "Getting warmer. One more adjustment.",
    "Close. A little more.",
    "Almost acceptable. Tweak it.",
  ],
  skeptical: [
    "Alright, we're in the ballpark now. Little bit more.",
    "Okay, that's more reasonable. Just a touch lower.",
    "Now we're talking. Sharpen the pencil one more time.",
  ],
  enthusiastic: [
    "Ooh so close! Just a tiny bit more! Come on!",
    "We're almost there! I can feel it! A little more!",
    "YES! Getting there! One more push!",
  ],
  analytical: [
    "Within acceptable range. Minor adjustment needed.",
    "Approaching optimal. 3-5% reduction required.",
    "Close to agreement. Fine-tune the numbers.",
  ],
};

const DEAL_ACCEPTED: Record<PersonalityType, string[]> = {
  friendly: [
    "You know what? That works! Let's do it! 🤝",
    "Deal! I'm excited! Where do I sign?",
    "Alright, you got me! That's fair! Deal!",
  ],
  serious: [
    "Acceptable. We have a deal.",
    "Done. Let's proceed with paperwork.",
    "Deal. Final answer.",
  ],
  skeptical: [
    "Fine. That's actually fair. Deal.",
    "Alright, you earned it. I'll take it.",
    "Okay, I admit it - that's reasonable. Deal.",
  ],
  enthusiastic: [
    "YES! DEAL! This is the best day ever! 🎉",
    "I'LL TAKE IT! Let's sign! I'm so happy!",
    "DONE! SOLD! Let's go! I can't wait!",
  ],
  analytical: [
    "The numbers work. I accept your offer.",
    "This aligns with my calculations. Deal.",
    "Optimal price point achieved. Transaction approved.",
  ],
};

const FRUSTRATED_WALKING: Record<PersonalityType, string[]> = {
  friendly: [
    "Look, I really wanted to work something out, but this isn't going anywhere...",
    "I'm trying here, but I just can't make these numbers work. I might have to look elsewhere.",
  ],
  serious: [
    "We're done here. This is a waste of time.",
    "I'm walking. Don't bother calling me.",
  ],
  skeptical: [
    "I knew coming here was a mistake. You're just like all the others.",
    "Forget it. I'll find an honest dealer somewhere else.",
  ],
  enthusiastic: [
    "Aww, I was so excited but... I just can't do these prices. I'm sorry!",
    "This is making me so sad! I really wanted this to work! Maybe another time?",
  ],
  analytical: [
    "Calculation suggests a net negative outcome. Terminating negotiation.",
    "Cost-benefit analysis: negative. Proceeding to alternative vendor.",
  ],
};

const WILD_INPUT_RESPONSES: Record<PersonalityType, string[]> = {
  friendly: [
    "Whoa, that's uncalled for. I think I'll just head out.",
    "I don't appreciate that kind of talk. Goodbye.",
    "I'm looking for a car, not an argument or... whatever that was. I'm leaving.",
  ],
  serious: [
    "I don't have time for this nonsense. We're done.",
    "Inappropriate. I'm taking my business elsewhere.",
    "That is highly unprofessional. Goodbye.",
  ],
  skeptical: [
    "I knew this place was weird. I'm out of here.",
    "Are you serious? You're crazy. I'm leaving.",
    "Typical. I'm not dealing with someone like you. Bye.",
  ],
  enthusiastic: [
    "Oh my gosh! That's so mean! I'm leaving!",
    "Wait, what?! Why would you say that? I don't want to be here anymore!",
    "That's not nice at all! I'm going to another dealership!",
  ],
  analytical: [
    "Communication detected as hostile or irrational. Terminating interaction immediately.",
    "Interaction parameters have exceeded acceptable social boundaries. Goodbye.",
    "Nonsensical or offensive input received. Transaction aborted.",
  ],
};

const WRONG_PAYMENT_TYPE: Record<string, string[]> = {
  cash: [
    "Hold on - I'm paying cash. I don't want monthly payments. What's the total?",
    "No financing for me. Give me the out-the-door number.",
    "Cash buyer here. Skip the payment stuff and give me the OTD price.",
  ],
  payment: [
    "Wait, what's that monthly? Break it down for me.",
    "I need to know the monthly payment, not the total.",
    "How much per month? That's what matters to me.",
  ],
};

// @ts-ignore - Reserved for future use
const INVENTORY_DENIAL_PUSHBACK: Record<PersonalityType, string[]> = {
  friendly: [
    "Are you sure? I could have sworn I saw one.",
    "Oh really? Can you double check? I'm pretty flexible but I really wanted that.",
    "That's surprising! Is there maybe one on the way?",
  ],
  serious: [
    "Check your inventory again. I'm not in a rush.",
    "Are you certain? I did my research before coming here.",
    "I'd like you to be absolutely sure before we move on.",
  ],
  skeptical: [
    "Yeah right. Did you even look?",
    "You just don't want to sell it to me. Check again.",
    "I bet you have one in the back. Go look.",
  ],
  enthusiastic: [
    "Aww! Are you 100% sure?! Please check again!",
    "No way! I was so hoping for it! Maybe one is hiding?",
    "Really? Can you check one more time for me?",
  ],
  analytical: [
    "Please verify inventory data. Discrepancy detected.",
    "I request a secondary check of your stock.",
    "Probability of zero stock is low. Please confirm.",
  ],
};

const DEAL_ACCEPTED_GREAT_VALUE: Record<PersonalityType, string[]> = {
  friendly: [
    "Wow! At that price, I can't say no! I'll take it!",
    "That is such a steal! I don't care about the other stuff, let's do it!",
    "You know what? For that price, I can live with it. Deal!",
  ],
  serious: [
    "The value proposition is undeniable. I'll take it.",
    "That price dictates the decision. Proceed.",
    "Agreed. The savings outweigh the compromised specifications.",
  ],
  skeptical: [
    "Okay, even I have to admit that's a crazy good price. Fine, I'll take it.",
    "Are you serious? For that much off? ...Alright, twist my arm. Sold.",
    "I'd be stupid to walk away from that deal. Write it up.",
  ],
  enthusiastic: [
    "OH MY GOSH! Are you serious?! That's so cheap! YES!",
    "I can't believe this deal! I'm buying it right now!",
    "At that price?! SOLD! SOLD! SOLD!",
  ],
  analytical: [
    "Price point is 20% below market average. Purchase is logical optimization.",
    "Value-to-cost ratio exceeds threshold. Executing purchase.",
    "Economic opportunity identified. Proceeding with transaction.",
  ],
};

// @ts-ignore - Reserved for future use
const INVENTORY_ADMISSION_SUCCESS: Record<PersonalityType, string[]> = {
  friendly: [
    "Oh, that's a shame! Well, I'm open to suggestions. What do you have?",
    "No worries! I'm not set in stone. Show me something else nice!",
    "Ah, bummer. But I trust you - what else is good on the lot?",
  ],
  serious: [
    "Unfortunate. I suppose I can look at alternatives if they are comparable.",
    "I see. Well, don't waste my time. What DO you have that's worth buying?",
    "That is disappointing. Show me what is available then.",
  ],
  skeptical: [
    "Of course you don't. Figures. Fine, what IS actually here?",
    "Typical. Bait and switch? Whatever, show me what you got.",
    "Ugh. Fine. I'm already here. Show me something else.",
  ],
  enthusiastic: [
    "Aww man! That's okay though! I'm sure you have other awesome cars!",
    "Oh no! Well, surprise me! What else is cool?!",
    "That's sad, but I'm still excited to buy a car! What else can I see?",
  ],
  analytical: [
    "Noted. Resetting search parameters. What inventory is currently available?",
    " unavailability acknowledged. Please present alternative options.",
    "I will adjust my criteria. Proceed with available inventory.",
  ],
};

// @ts-ignore - Reserved for future use
const INVENTORY_ADMISSION_FAILURE: Record<PersonalityType, string[]> = {
  friendly: [
    "Oh... that's really the only car I wanted. I think I'll look somewhere else.",
    "That's disappointing. I really had my heart set on that. Thanks anyway.",
  ],
  serious: [
    "That was a waste of my trip. I'm leaving.",
    "If you don't have what I need, we have nothing to discuss.",
  ],
  skeptical: [
    "I knew it. You guys never have anything good. I'm out.",
    "See? Complete waste of time. I'm walking.",
  ],
  enthusiastic: [
    "Aww, that's literally the only one I wanted! I'm so sad! Bye!",
    "Noooo! My dream car! I can't look at anything else right now!",
  ],
  analytical: [
    "Specific requirement matching failed. Terminating purchase process.",
    "Critical criteria not met. Aborting transaction.",
  ],
};

// ============ HELPER FUNCTIONS ============

const FEATURE_LABELS: Record<DesiredFeature, string> = {
  sporty: 'sporty',
  fuel_efficient: 'fuel efficient',
  luxury: 'luxurious',
  family: 'family-friendly',
  affordable: 'affordable',
  tech: 'high-tech',
  spacious: 'spacious',
  reliable: 'reliable',
};

function formatFeatures(features: DesiredFeature[]): string {
  const labels = features.map(f => FEATURE_LABELS[f]);
  if (labels.length === 1) return labels[0];
  return labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function isWildInput(text: string): boolean {
  const wildKeywords = [
    /\b(stupid|idiot|dumb|shut up|hate you|you suck|garbage|trash|moron|loser)\b/i,
    /\b(kill|die|hurt|punch|hit)\b/i,
    /\b(fucking|fuck you|shit)\b/i, // Only extreme profanity, not mild words
    /\$(0|1)(?![0-9,])|\bfree\b|\bzero dollars\b/i, // Only explicit $0, $1, or "free" - not just "0" (matches $1 but not $1,000)
    /^[asdfghjkl\s]{15,}$/i, // Keyboard mashing (increased threshold)
    /(.)\1{10,}/, // Repeats like aaaaaaaaaaa
  ];

  return wildKeywords.some(regex => regex.test(text));
}

export function isNeedsInquiry(text: string): boolean {
  const needsKeywords = [
    /\b(what|which)\b.*\b(looking|want|need|shopping|search|find|desire|hoping|market)\b/i, // "What are you looking for?"
    /\b(budget|spend|cost|price|afford)\b/i, // "What's your budget?"
    /\b(help)\b.*\b(you)\b/i, // "How can I help you?"
    /\b(type|kind|sort)\b.*\b(car|vehicle)\b/i, // "What type of car?"
  ];
  return needsKeywords.some(regex => regex.test(text));
}

export function isInventoryAdmission(text: string): boolean {
  const admissionKeywords = [
    /\b(don't|dont|do not)\b.*\b(have|got|stock)\b/i, // "I don't have that", "We don't got that"
    /\b(out of|no)\b.*\b(stock|inventory)\b/i, // "Out of stock", "No inventory"
    /\b(sold|gone)\b/i, // "It's sold", "It's gone"
    /\b(cant|can't|cannot)\b.*\b(get|find)\b/i, // "Can't get that"
  ];
  return admissionKeywords.some(regex => regex.test(text));
}

export function isTakeItOrLeaveIt(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Direct phrase matches (most reliable)
  const directPhrases = [
    'all i have',
    'all we have',
    'all i got',
    'all we got',
    'take it or leave it',
    'only option',
    'only choice',
    'only one',
    'only one left',
    'best i can do',
    'best we can do',
    'thats it',
    "that's it",
    'nothing else',
  ];
  
  if (directPhrases.some(phrase => lowerText.includes(phrase))) {
    return true;
  }
  
  // Regex fallbacks for variations
  const patterns = [
      /\bthis is (all|it)\b/i,
      /\b(take|accept) it or (leave|go)\b/i,
  ];
  
  return patterns.some(regex => regex.test(text));
}

// @ts-ignore - Reserved for future use
const TAKE_IT_OR_LEAVE_IT_SUCCESS: Record<PersonalityType, string[]> = {
  friendly: [
      "Well... if that's really the only option, I guess I'll take it! It's still a nice car.",
      "Okay then! I don't want to leave empty handed. Let's do it.",
      "Fair enough. I trust you. I'll take this one."
  ],
  serious: [
      "I see. Given the market conditions, I will accept this vehicle as the solution.",
      "Very well. If the inventory is limited, I will proceed with this purchase.",
      "Understood. Let's finalize the paperwork for this unit then."
  ],
  skeptical: [
      "Fine. I guess I'm stuck with this one. Whatever, let's just get it over with.",
      "You're lucky I need a car today. I'll take it, but I'm not thrilled.",
      "Ugh. Fine. I'll take it."
  ],
  enthusiastic: [
      "Okay!!! I just really want a car today! I'll take it!!",
      "If that's the only one, then it's DESTINY! Let's do it!",
      "I can't wait any longer! I'll take this one! Yay!"
  ],
  analytical: [
      "Analyzing alternatives... None available. Proceeding with current local optimum.",
      "Given the constraint of limited inventory, acceptance is the logical path.",
      "I will acquire this unit rather than restart the search process."
  ],
};

// @ts-ignore - Reserved for future use
const TAKE_IT_OR_LEAVE_IT_FAILURE: Record<PersonalityType, string[]> = {
  friendly: [
      "I understand, but I just can't settle for something I don't love. Sorry!",
      "If that's all you have, I think I better keep looking elsewhere. Thanks anyway!",
      "Ah that's a shame. I really need something else. Bye!"
  ],
  serious: [
      "Then we have nothing more to discuss. Good day.",
      "That is unacceptable. I will find a dealership with better stock.",
      "I am not one to settle. Goodbye."
  ],
  skeptical: [
      "Wow. 'That's all you have'? What a joke. I'm leaving.",
      "I knew this place was a waste of time. Don't bother calling me back.",
      "Yeah, right. I'm not buying your leftovers. See ya."
  ],
  enthusiastic: [
      "But I don't want thiiiis one! I'm so sad! I have to go!",
      "Noooo! I can't believe that's it! I'm leaving!",
      "Aww! I guess I won't get a car today after all. Bye!"
  ],
  analytical: [
      "Inventory constraints prevent optimal matching. Terminating process.",
      "Current option does not meet threshold criteria. Aborting.",
      "Insufficient selection. I will conduct business elsewhere."
  ],
};

export function isCreditDenial(text: string): boolean {
  const denialKeywords = [
    /\b(denied|deny|decline|declined)\b/i, // "Credit denied", "You were declined"
    /\b(not|n't)\b.*\b(approved|approve|qualify|qualified)\b/i, // "You're not approved", "Didn't qualify"
    /\b(bad|low|poor)\b.*\b(credit|score)\b/i, // "Bad credit", "Score too low"
    /\b(bank)\b.*\b(no|said no|reject)\b/i, // "Bank said no"
  ];
  return denialKeywords.some(regex => regex.test(text));
}

/** Player/salesperson is asking for final confirmation to close (e.g. "Does this look good?", "Ready to sign?") */
export function isPlayerClosingAttempt(text: string): boolean {
  const lower = text.toLowerCase();
  const closingPhrases = [
    'look good', 'looks good', 'good enough', 'put your name on it',
    'ready to sign', 'sign the', 'finalize', 'wrap this up', 'we have a deal',
    'do we have a deal', 'shall we', 'next steps', 'where do i sign',
    'ready to make it official', 'make it official', 'finalize everything',
  ];
  if (closingPhrases.some(p => lower.includes(p))) return true;
  return /\b(deal|sign|close)\b.*\?/i.test(text) || /ready\s+to\s+(sign|close|finalize)/i.test(text);
}

/** Customer's last message indicated they accepted (deal, next steps, etc.) */
function lastAssistantIndicatedAcceptance(content: string): boolean {
  const lower = content.toLowerCase();
  const acceptPhrases = [
    "i'll take it", "i'll take", "i will take", "let's do it", "lets do it",
    "deal", "sold", "where do i sign", "next steps", "we have a deal",
    "accept", "agreed", "done", "ready to sign", "let's go", "lets go",
    "take it at", "must-have features confirmed",
  ];
  if (acceptPhrases.some(p => lower.includes(p))) return true;
  if (/\bat \$\d/i.test(content)) return true; // "at $38,000" etc.
  return /\b(deal|sold|accept|agreed)\b/i.test(lower);
}

// @ts-ignore - Reserved for future use
const CREDIT_DENIAL_RESPONSES: Record<PersonalityType, string[]> = {
  friendly: [
      "Oh... that's really embarrassing. I guess I can't buy a car today then. Sorry to waste your time.",
      "I see. That's disappointing to hear. I'll go work on my credit and come back another time.",
      "Ouch. I was hoping it would go through. Thanks for checking anyway."
  ],
  serious: [
      "I understand. If the bank won't lend, we have no business to conduct.",
      "Well, that's final then. I will be leaving.",
      "Disappointing. I thought I had everything in order. Goodbye."
  ],
  skeptical: [
      "Figures. You guys never approve anyone unless they have perfect credit.",
      "Yeah, yeah. I knew this was a waste of time. I'm out.",
      "Of course. Whatever, I'll go to a buy-here-pay-here lot."
  ],
  enthusiastic: [
      "Oh no! Really?! I wanted this car so bad! This is the worst day ever!",
      "No way! Are you sure?! Aww man... I guess I have to leave...",
      "That makes me so sad! I was ready to drive it home!"
  ],
  analytical: [
      "Financing rejection acknowledged. Transaction cannot proceed. Terminating.",
      "Credit parameters insufficient. Aborting purchase process.",
      "Understood. Without financing, I cannot acquire the asset. Goodbye."
  ],
};

// @ts-ignore - Reserved for future use
const CREDIT_DENIAL_PUSHBACK: Record<PersonalityType, string[]> = {
  friendly: [
      "But wait! I have a huge down payment! Doesn't that help??",
      "Hold on - even with my large down payment? Are you sure?",
      "Please check again! I'm putting so much money down!"
  ],
  serious: [
      "Incorrect. My down payment is substantial. Run it again.",
      "I am putting serious cash down. That changes the risk profile.",
      "Re-evaluate. My down payment covers a significant portion of the asset."
  ],
  skeptical: [
      "Are you blind? I'm putting more than half down! That has to count for something.",
      "Don't give me that. Look at the down payment I'm offering.",
      "You're turning down cash? I have a huge down payment right here."
  ],
  enthusiastic: [
      "Wait wait! I have so much cash for the down payment! Please let me have the car!",
      "But I saved up SO MUCH for the down payment! Doesn't that work?!",
      "Don't make me leave! Look at my down payment money!"
  ],
  analytical: [
      "Objection. Loan-to-value ratio is favorable due to high down payment.",
      "Re-calculate risk. Large capital contribution significantly reduces exposure.",
      "My down payment alters the approval probability. Please reconsider."
  ],
};

// Unused but kept for reference
// @ts-ignore
function _calculatePayment(price: number, downPayment: number, apr: number, months: number): number {
  const principal = price - downPayment;
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment);
}

// Check if a car matches the customer's desired vehicle category (uses car.category set at creation)
function carMatchesCategory(car: Car, customer: Customer): boolean {
  const category = customer.desiredCategory;
  if (category === 'any') return true;
  if (category === 'hybrid') {
    // No hybrid segment in DB; treat as sedan or SUV
    return car.category === 'sedan' || car.category === 'suv';
  }
  return car.category === category;
}

interface MatchResult {
  matched: DesiredFeature[];
  missing: DesiredFeature[];
  score: number; // 0 to 1
}

function carMatchesFeatures(car: Car, features: DesiredFeature[]): MatchResult {
  const matched: DesiredFeature[] = [];
  const missing: DesiredFeature[] = [];
  
  // SINGLE SOURCE OF TRUTH: We check the car's assigned features
  // which are generated by getVehicleFeatures using the exact logic for trims/models.
  for (const feature of features) {
    if (car.features.includes(feature)) {
      matched.push(feature);
    } else {
      missing.push(feature);
    }
  }
  
  const score = features.length > 0 ? matched.length / features.length : 1;
  return { matched, missing, score };
}

export function detectSentiment(text: string): Sentiment {
  const happy = /\b(yes|deal|love|great|happy|good|perfect|appreciate|thanks|thank|awesome|excited)\b/i;
  const mad = /\b(no|wait|stop|unacceptable|wrong|bad|ignore|angry|mad|insult|stupid|idiot|hate|suck|trash|worst)\b/i;
  const disinterested = /\b(maybe|think|consider|later|else|walking|leave|leaving|whatever|boring|slow)\b/i;

  if (mad.test(text)) return 'mad';
  if (happy.test(text)) return 'happy';
  if (disinterested.test(text)) return 'disinterested';
  
  return 'neutral';
}

// ============ MAIN RESPONSE GENERATOR ============

export interface ResponseContext {
  customer: Customer;
  currentCar: Car | null;
  messageType: 'greeting' | 'car_shown' | 'offer' | 'general' | 'ask_budget' | 'ask_type' | 'ask_features' | 'ask_model';
  offerPrice?: number;
  offerType?: 'selling' | 'otd' | 'payment';
  offerDownPayment?: number;
  offerAPR?: number;
  offerTerm?: number;
}

export interface ResponseResult {
  response: string;
  interestChange: number;
  dealAccepted: boolean;
  newPhase?: ConversationPhase;
  isLost?: boolean;
  customerSentiment: Sentiment;
  playerSentiment: Sentiment;
}

export function generateResponse(context: ResponseContext): ResponseResult {
  const { customer, currentCar, messageType, offerPrice, offerType } = context;
  const { personality, buyerType, interest, temper, budget, maxPayment, desiredDown, desiredFeatures } = customer;

  let playerSentiment: Sentiment = 'neutral';
  // We don't have the player's text here in generateResponse context usually, 
  // but we can infer it if it's an offer or car_shown.
  if (messageType === 'offer') playerSentiment = 'neutral'; 

  let response = '';
  let interestChange = 0;
  let dealAccepted = false;
  let isLost = false;
  let newPhase: ConversationPhase | undefined;

  switch (messageType) {
    case 'greeting': {
      // Customer tells what they're looking for
      if (customer.isGuarded) {
         response = "Hello. I'm just looking today, I don't really want to answer any questions.";
         interestChange = 2; // Neutral
      } else {
         response = pickRandom(GREETING_RESPONSES[personality](desiredFeatures, customer));
         interestChange = 5; // Slight interest bump for engagement
         // Reveal info since they just said it
         customer.revealedPreferences.budget = true;
         customer.revealedPreferences.type = true;
      }
      newPhase = 'needs_discovery';
      break;
    }

    case 'ask_budget': {
      // Difficult/Guarded customers refuse to reveal their budget
      if (customer.isDifficult || customer.isGuarded) {
        response = pickRandom(DIFFICULT_CUSTOMER_RESPONSES.budget[personality]());
        interestChange = -5; // They're annoyed you asked
      } else {
        response = pickRandom(DISCOVERY_RESPONSES.budget[personality](customer));
        customer.revealedPreferences.budget = true;
        interestChange = 5;
      }
      break;
    }

    case 'ask_type': {
      // Difficult/Guarded customers refuse to reveal their type preference
      if (customer.isDifficult || customer.isGuarded) {
        response = pickRandom(DIFFICULT_CUSTOMER_RESPONSES.type[personality]());
        interestChange = -5; // They're annoyed you asked
      } else {
        response = pickRandom(DISCOVERY_RESPONSES.type[personality](customer));
        customer.revealedPreferences.type = true;
        interestChange = 5;
      }
      break;
    }

    case 'ask_features': {
      // Difficult/Guarded customers refuse to reveal their feature preferences
      if (customer.isDifficult || customer.isGuarded) {
        response = pickRandom(DIFFICULT_CUSTOMER_RESPONSES.features[personality]());
        interestChange = -5; // They're annoyed you asked
      } else {
        response = pickRandom(DISCOVERY_RESPONSES.features[personality](customer));
        customer.revealedPreferences.features = true;
        interestChange = 5;
      }
      break;
    }

    case 'ask_model': {
      // Difficult/Guarded customers refuse to reveal their model preference
      if (customer.isDifficult || customer.isGuarded) {
        response = pickRandom(DIFFICULT_CUSTOMER_RESPONSES.model[personality]());
        interestChange = -5; // They're annoyed you asked
      } else {
        response = pickRandom(DISCOVERY_RESPONSES.model[personality](customer));
        customer.revealedPreferences.model = true;
        interestChange = 5;
      }
      break;
    }

    case 'car_shown': {
      if (!currentCar) {
        response = "What car are you showing me?";
        break;
      }

      // Check if car matches what they want (both category AND features)
      const matchesCategory = carMatchesCategory(currentCar, customer);
      const featureMatch = carMatchesFeatures(currentCar, desiredFeatures);
      
      let isPerfectMatch = matchesCategory && featureMatch.score === 1;
      let isGoodMatch = matchesCategory && featureMatch.score >= 0.5;

      // BAD CREDIT OVERRIDE: If credit < 620 and revealed, they aren't picky!
      if (customer.creditRevealed && customer.creditScore < 620) {
          isPerfectMatch = true; // Pretend it matches perfectly
          isGoodMatch = true;
          // You could add specific dialogue here or just let them react positively
      }
      
      if (isPerfectMatch) {
        if (customer.creditRevealed && customer.creditScore < 620) {
            // Specific response for bad credit acceptance
            response = "With my credit situation, I can't look a gift horse in the mouth. This car works for me.";
        } else {
            response = pickRandom(CAR_REACTION_POSITIVE[personality]);
        }
        interestChange = 15;
        // Recovery: if they like the car, it can clear a strike
        if (customer.strikes > 0) customer.strikes--;
        
        // REVEAL: If they find a perfect match, reveal what they wanted anyway
        if (customer.isGuarded) {
          customer.revealedPreferences.features = true;
          customer.revealedPreferences.type = true;
          customer.revealedPreferences.model = true;
        }

        newPhase = 'asking_numbers'; // They like it, ready for pricing
      } else {
        // Handle partial matches or total mismatches
        if (matchesCategory && featureMatch.missing.length > 0) {
          // Category matches but misses specific features
          const missingText = featureMatch.missing.map(f => FEATURE_LABELS[f]).join(' or ');
          response = `It is ${CATEGORY_LABELS[customer.desiredCategory]}, but I really wanted something ${missingText}.`;
          interestChange = -5;
        } else if (!matchesCategory) {
          // Wrong category entirely
          response = pickRandom(CAR_REACTION_NEGATIVE[personality]);
          interestChange = -5; // Reduced from -10
        } else {
          // Generic fallback
          response = pickRandom(CAR_REACTION_NEGATIVE[personality]);
          interestChange = -3; // Reduced from -8
        }
        
        customer.strikes++;
        
        // GUARDED REVEAL LOGIC
        if (customer.isGuarded) {
           if (customer.strikes === 1) {
              customer.revealedPreferences.features = true;
              customer.revealedPreferences.type = true; // Revealed together
              response += " Actually, I'm really looking for something " + formatFeatures(customer.desiredFeatures) + ".";
           } else if (customer.strikes === 2) {
              customer.revealedPreferences.model = true;
              if (customer.desiredModel) {
                 response += " Honestly, I really had my heart set on a " + customer.desiredModel + ".";
              } else {
                 response += " I just want " + CATEGORY_LABELS[customer.desiredCategory] + " that fits my needs.";
              }
           }
        }
        
        // Give them more chances (4 strikes instead of 3), and ensure interest doesn't just zero out immediately
        // Also added a check to ensure they've seen at least a few cars or had some interaction
        const isVeryMad = interest + interestChange <= 0;
        const tooManyStrikes = customer.strikes >= 4; // Increased from 3
        
        if ((tooManyStrikes && !isGoodMatch) || (tooManyStrikes && isVeryMad)) {
          isLost = true;
          response = pickRandom(FRUSTRATED_WALKING[personality]);
        } else {
          newPhase = 'needs_discovery'; // Suggest they show them something else
        }
      }
      break;
    }

    case 'offer': {
      if (!offerPrice || !offerType) {
        response = "What's the offer?";
        break;
      }

      // Check if offer type matches buyer type
      if (buyerType === 'cash' && offerType === 'payment') {
        response = pickRandom(WRONG_PAYMENT_TYPE.cash);
        interestChange = -10;
        break;
      }
      if (buyerType === 'payment' && offerType !== 'payment') {
        response = pickRandom(WRONG_PAYMENT_TYPE.payment);
        interestChange = -5;
        break;
      }

      // Check for down payment mismatch (Finance specifically)
      if (offerType === 'payment' && context.offerDownPayment !== undefined) {
          // If offer down > desired down, reject unless they are VERY happy
          const diff = context.offerDownPayment - desiredDown;
          if (diff > 500 && interest < 80) {
            response = pickRandom(DOWN_PAYMENT_REJECTION[personality](context.offerDownPayment, desiredDown));
            interestChange = -10;
            newPhase = 'negotiation';
            break;
          }
      }

      // GUARDED REVEAL: If they were guarded, reveal budget when an offer is made
      if (customer.isGuarded) {
         customer.revealedPreferences.budget = true;
      }

      // Increment offer count for attrition/persistence logic
      customer.offerCount = (customer.offerCount || 0) + 1;

      // ATTRITION LOGIC: Repeated offers
      if (customer.offerCount > 4) {
          const caveChance = (interest / 200) + (temper / 200); // Max 1.0 combined
          if (Math.random() < caveChance) {
              response = pickRandom(CAVE_RESPONSES[personality]);
              interestChange = 10;
              dealAccepted = true;
              newPhase = 'closed';
              break;
          } else if (Math.random() < 0.3) {
              // They leave!
              response = pickRandom(FRUSTRATED_WALKING[personality]);
              interestChange = -50;
              isLost = true;
              newPhase = 'closed';
              break;
          } else {
              // Keep resisting
              response = pickRandom(PERSISTENCE_PUSHBACK[personality]);
              interestChange = -5;
              newPhase = 'negotiation';
              break;
          }
      }

      // Calculate budget with mood modifier (high interest = up to 10% more)
      const moodMultiplier = 1 + (interest / 1000); // 0-10% bonus based on interest
      const effectiveBudget = buyerType === 'cash' 
        ? Math.round(budget * moodMultiplier)
        : Math.round(maxPayment * moodMultiplier);

      const targetPrice = effectiveBudget;
      const isPayment = offerType === 'payment';

      // Check for 'Great Deal' override: 20% off MSRP for cash/OTD, or payment well under their max
      const isGreatDealCash = currentCar && !isPayment && offerPrice <= currentCar.price * 0.8;
      const isGreatDealPayment = isPayment && offerPrice <= maxPayment * 0.9; // payment at or below ~90% of max = obvious discount
      if (isGreatDealCash || isGreatDealPayment) {
         response = pickRandom(DEAL_ACCEPTED_GREAT_VALUE[personality]);
         interestChange = 30;
         customer.strikes = 0;
         dealAccepted = true;
         newPhase = 'closed';
         break;
      }

      if (offerPrice <= targetPrice) {
        // Deal accepted!
        response = pickRandom(DEAL_ACCEPTED[personality]);
        interestChange = 25;

        customer.strikes = 0; // Huge recovery on good offer
        dealAccepted = true;
        newPhase = 'closed';
      } else if (offerPrice <= targetPrice * 1.05) {
        // Very close - one more push
        response = pickRandom(OFFER_CLOSE[personality]);
        interestChange = 5;
        newPhase = 'negotiation';
      } else if (offerPrice <= targetPrice * 1.15) {
        // Counteroffer needed
        const counter = buyerType === 'cash' ? budget : maxPayment;
        response = pickRandom(OFFER_TOO_HIGH[personality](counter, isPayment, isPayment ? desiredDown : undefined));
        interestChange = -5;
        newPhase = 'negotiation';
      } else {
        // Way too high
        customer.strikes++;
        // Only walk if they have multiple strikes AND are very frustrated, or if patience is completely gone
        if ((customer.strikes >= 3 && interest < 30) || (interest - 10 < 5) || (temper < 10)) {
          // They're walking
          response = pickRandom(FRUSTRATED_WALKING[personality]);
          interestChange = -30;
          isLost = true;
        } else {
          // Frustrated but still engaged
          const counter = buyerType === 'cash' 
            ? Math.round(budget * 0.95) 
            : Math.round(maxPayment * 0.95);
          response = pickRandom(OFFER_TOO_HIGH[personality](counter, isPayment, isPayment ? desiredDown : undefined));
          interestChange = -12; // Reduced from -15
        }
        newPhase = 'negotiation';
      }
      break;
    }

    case 'general':
    default: {
      // Check for needs inquiry first
      // @ts-ignore - inference issue with context.message which isn't in ResponseContext but we can pass it or check logic differently
      // Actually we don't have the message here in non-AI path usually?
      // For the non-AI path, we might rely on the calling code to detect this phase or just fallback to generic.
      // BUT for this specific refactor, let's just use the generic list for now, 
      // as the AI path will handle the actual detection with `isNeedsInquiry` in getAIResponse.
      // If we want to support this in pure-scripted mode, we'd need the input text.
      
      const generalResponses = [
        "Hmm, tell me more.",
        "I see. What else can you show me?",
        "Interesting...",
        "Go on.",
        "Let me think about that.",
      ];
      response = pickRandom(generalResponses);
      break;
    }
  }

  const customerSentiment = detectSentiment(response);

  return { response, interestChange, dealAccepted, newPhase, isLost, customerSentiment, playerSentiment };
}

// ============ AI API INTEGRATION ============

export async function getAIResponse(
  customer: Customer,
  message: string,
  currentCar: Car | null,
  settings: GameSettings,
  contextOverrides?: Partial<ResponseContext>
): Promise<ResponseResult> {
  const playerSentiment = detectSentiment(message);
  const messageType = contextOverrides?.messageType;
  
  // Check for wild input first
  if (isWildInput(message)) {
    return {
      response: pickRandom(WILD_INPUT_RESPONSES[customer.personality]),
      interestChange: -100,
      dealAccepted: false,
      newPhase: 'closed',
      isLost: true,
      customerSentiment: 'mad',
      playerSentiment: playerSentiment
    };
  }

  // --- ANALYSIS PHASE ---
  // --- ANALYSIS PHASE ---
  let instructionType: string | undefined;
  let scenarioData: any = {};
  
  // Initialize Logic Variables
  let dealQuality: string | undefined;
  let interestChange = 0;
  let dealAccepted = false;
  let isLost = false;
  let newPhase: ConversationPhase | undefined;

  // Check for specific discovery questions and reveal info automatically
  // This allows the AI to answer naturally while we update the game state
  // We use the same regex patterns or check if contextOverrides passed a specific messageType
  
  // Discovery questions only reveal for non-guarded/non-difficult customers
  // Unless we decide guarded customers can be "cracked" via direct questioning (currently they refuse)
  if (!customer.isGuarded && !customer.isDifficult) {
    if (contextOverrides?.messageType === 'ask_budget') customer.revealedPreferences.budget = true;
    if (contextOverrides?.messageType === 'ask_type') customer.revealedPreferences.type = true;
    if (contextOverrides?.messageType === 'ask_features') customer.revealedPreferences.features = true;
    if (contextOverrides?.messageType === 'ask_model') customer.revealedPreferences.model = true;
  }

  // Handle GUARDED progressive reveal for car_shown in AI path
  if (customer.isGuarded && messageType === 'car_shown') {
    // Check if the car is a match (mimic scripted logic for reveal triggers)
    const categoryMatch = currentCar ? carMatchesCategory(currentCar, customer) : false;
    const featureMatch = currentCar ? carMatchesFeatures(currentCar, customer.desiredFeatures) : { score: 0 };
    const isPerfect = categoryMatch && featureMatch.score === 1;

    if (!isPerfect) {
      customer.strikes++;
      if (customer.strikes === 1) {
        customer.revealedPreferences.features = true;
        customer.revealedPreferences.type = true; // Usually revealed together
      } else if (customer.strikes === 2) {
        customer.revealedPreferences.model = true;
      }
    } else {
      // If it's a perfect match, reveal everything except maybe budget
      customer.revealedPreferences.features = true;
      customer.revealedPreferences.type = true;
      customer.revealedPreferences.model = true;
    }
  }

  // Also reveal budget if an offer is made while guarded
  if (customer.isGuarded && messageType === 'offer') {
    customer.revealedPreferences.budget = true;
  }

  // Check for "Take it or leave it" ultimatum
  if (isTakeItOrLeaveIt(message)) {
      let takeItChance = 0.1;
      if (currentCar) {
          const catMatch = carMatchesCategory(currentCar, customer);
          const featMatch = carMatchesFeatures(currentCar, customer.desiredFeatures);
          if (catMatch) takeItChance += 0.3;
          if (featMatch.score >= 0.5) takeItChance += 0.3;
          if (featMatch.score === 1) takeItChance += 0.3;
      }
      if (customer.personality === 'friendly') takeItChance += 0.2;
      if (customer.personality === 'enthusiastic') takeItChance += 0.1;
      if (customer.personality === 'serious') takeItChance += 0.1;
      if (customer.personality === 'skeptical') takeItChance -= 0.3;

      if (Math.random() < takeItChance) {
          instructionType = 'take_it_success';
      } else {
          instructionType = 'take_it_failure';
      }
  }

  // Check for inventory admission (e.g. "I don't have that")
  if (isInventoryAdmission(message)) {
    let stayChance = 0.5;
    if (customer.personality === 'friendly') stayChance += 0.2;
    if (customer.personality === 'enthusiastic') stayChance += 0.2;
    if (customer.personality === 'skeptical') stayChance -= 0.2;
    if (customer.personality === 'serious') stayChance -= 0.1;

    if (Math.random() < stayChance) {
        instructionType = 'inventory_stay';
    } else {
        instructionType = 'inventory_leave';
    }
  }

  // Check for Credit Denial
  if (isCreditDenial(message)) {
      if (contextOverrides?.offerDownPayment !== undefined && contextOverrides.offerDownPayment >= 7500) {
          instructionType = 'credit_pushback';
          scenarioData = { offeredDown: contextOverrides.offerDownPayment };
      } else {
          instructionType = 'credit_denial';
      }
  }

  // Also check natural language questions if no explicit type passed
  if (!customer.isGuarded && !messageType) {
    if (/\b(budget|spend|cost|price|money)\b/i.test(message)) customer.revealedPreferences.budget = true;
    if (/\b(type|kind|style|suv|sedan)\b/i.test(message)) customer.revealedPreferences.type = true;
    if (/\b(feature|looking for|need|want|prefer)\b/i.test(message)) customer.revealedPreferences.features = true;
    if (/\b(what|specific|which)\b.*\b(model|brand|make)\b/i.test(message)) customer.revealedPreferences.model = true;
  }

  // Check for needs/budget inquiry (legacy check - can remove or keep as fallback)
  if (!customer.isGuarded && isNeedsInquiry(message)) {
     customer.revealedPreferences.type = true;
     customer.revealedPreferences.features = true;
  }

  // Offer Logic
  if (contextOverrides?.messageType === 'offer' && contextOverrides.offerPrice && contextOverrides.offerType) {
    const { offerPrice, offerType, offerDownPayment } = contextOverrides;
    const { buyerType, budget, maxPayment, desiredDown, interest, personality } = customer;

    if (buyerType === 'cash' && offerType === 'payment') {
      instructionType = 'offer_wrong_type_cash';
    } else if (buyerType === 'payment' && offerType !== 'payment') {
      instructionType = 'offer_wrong_type_payment';
    } else if (offerType === 'payment' && offerDownPayment && offerDownPayment > desiredDown * 1.05) {
      instructionType = 'offer_down_too_high';
      scenarioData = { offeredDown: offerDownPayment, desiredDown };
    } else {
      const moodMultiplier = 1 + (interest / 1000);
      const effectiveBudget = buyerType === 'cash' ? Math.round(budget * moodMultiplier) : Math.round(maxPayment * moodMultiplier);
      const isGreatDeal = offerType === 'payment'
        ? offerPrice <= maxPayment * 0.9
        : currentCar && offerPrice <= currentCar.price * 0.8;

      if (offerPrice <= effectiveBudget || isGreatDeal) {
        instructionType = 'offer_accepted';
      } else if (offerPrice <= effectiveBudget * 1.05) {
        instructionType = 'offer_close';
      } else if (offerPrice <= effectiveBudget * 1.15) {
        instructionType = 'offer_too_high'; 
        scenarioData = { budget: effectiveBudget };
      } else {
        // High price - check if they love the car (budget stretch) or want downgrade
        if (currentCar && carMatchesCategory(currentCar, customer) && carMatchesFeatures(currentCar, customer.desiredFeatures).score >= 0.8) {
           if (interest > 70 || personality === 'enthusiastic' || personality === 'friendly') {
              instructionType = 'offer_budget_stretch';
           } else if (interest < 40 || personality === 'serious' || personality === 'analytical') {
              instructionType = 'offer_downgrade_request';
           } else {
             instructionType = 'offer_way_too_high';
           }
        } else {
           instructionType = 'offer_way_too_high';
        }
      }
    }
  }

  // Player is asking to confirm/close after customer already accepted — avoid backtracking
  if (!instructionType && isPlayerClosingAttempt(message)) {
    const lastAsst = [...customer.conversationHistory].reverse().find(m => m.role === 'assistant');
    if (lastAsst && lastAssistantIndicatedAcceptance(lastAsst.content)) {
      instructionType = 'customer_affirm_close';
    }
  }
  
  // General Chat Fallback
  if (!instructionType) {
      instructionType = 'general_chat';
  }

  const systemPrompt = buildSystemPrompt(customer, currentCar, instructionType, scenarioData);

  try {
    let aiResponse = '';

    if (settings.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: AI_RESPONSE_MAX_TOKENS,
          system: systemPrompt,
          messages: [
            ...customer.conversationHistory.map((msg: AIConversationMessage) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: message },
          ],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      aiResponse = data.content?.[0]?.text || '';
    } else {
      // Local / OpenAI Compatible
      let baseUrl = settings.apiBaseUrl || 'http://localhost:1234/v1';
      // Ensure specific endpoint is targeted if just base URL is provided
      if (!baseUrl.includes('/chat/completions')) {
         baseUrl = baseUrl.replace(/\/+$/, '') + '/chat/completions';
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey || 'lm-studio'}`,
        },
        body: JSON.stringify({
          model: settings.modelName || 'local-model',
          messages: [
            { role: 'system', content: systemPrompt },
            ...customer.conversationHistory.map((msg: AIConversationMessage) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: message },
          ],
          max_tokens: AI_RESPONSE_MAX_TOKENS,
          temperature: 0.7,
        }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      aiResponse = data.choices?.[0]?.message?.content || '';
    }

    // Clean potential chain-of-thought tokens from reasoning models (DeepSeek R1 etc)
    const THINK_SECTION_REGEX = /<think\b[^>]*>[\s\S]*?<\/think>/gi;
    aiResponse = aiResponse.replace(THINK_SECTION_REGEX, ' ').replace(/\s{2,}/g, ' ').trim();

    // --- OUTCOME PROCESSING ---
    switch (instructionType) {
        case 'take_it_success':
            interestChange = 10;
            dealAccepted = true;
            newPhase = 'closed';
            break;
        case 'take_it_failure':
            interestChange = -100;
            isLost = true;
            newPhase = 'closed';
            break;
        case 'inventory_stay':
            interestChange = 5;
            newPhase = 'needs_discovery';
            // Clear preferences
            customer.desiredModel = undefined;
            customer.desiredCategory = 'any';
            break;
        case 'inventory_leave':
            interestChange = -100;
            isLost = true;
            newPhase = 'closed';
            break;
        case 'credit_pushback':
            interestChange = -5;
            newPhase = 'negotiation';
            break;
        case 'credit_denial':
            interestChange = -100;
            isLost = true;
            newPhase = 'closed';
            break;
        case 'offer_accepted':
            interestChange = 25;
            dealAccepted = true;
            customer.strikes = 0;
            newPhase = 'closed';
            break;
        case 'offer_budget_stretch':
            interestChange = 25;
            dealAccepted = true;
            customer.strikes = 0;
            newPhase = 'closed';
            if (contextOverrides?.offerPrice) {
                 if (customer.buyerType === 'cash') customer.budget = contextOverrides.offerPrice;
                 else customer.maxPayment = Math.round(contextOverrides.offerPrice / 60);
            }
            break;
        case 'offer_close':
            interestChange = 5;
            newPhase = 'negotiation';
            break;
        case 'offer_too_high':
        case 'offer_down_too_high':
        case 'offer_wrong_type_cash':
        case 'offer_wrong_type_payment':
        case 'offer_downgrade_request':
            interestChange = -5;
            newPhase = 'negotiation';
            break;
        case 'offer_way_too_high':
            customer.strikes++;
             // Duplicate logic check from original
            if (contextOverrides?.offerPrice && customer.budget) {
                const effectiveBudget = customer.budget * (1 + (customer.interest / 1000));
                 if (contextOverrides.offerPrice > effectiveBudget * 2.0) {
                     interestChange = -100; isLost = true;
                 } else if (contextOverrides.offerPrice > effectiveBudget * 1.5) {
                    customer.strikes += 2; interestChange = -40;
                 } else {
                    interestChange = -15;
                 }
            } else {
                interestChange = -15;
            }
             if ((customer.strikes >= 3 && customer.interest + interestChange < 15) || customer.interest + interestChange <= 0) {
                isLost = true;
             }
            newPhase = 'negotiation';
            break;
        case 'customer_affirm_close':
            interestChange = 5;
            dealAccepted = true;
            customer.strikes = 0;
            newPhase = 'closed';
            break;
        case 'general_chat':
        default:
             // Logic will fall through to sentiment analysis below if no explicit instruction action
             break;
    }

    // If we pre-calculated deal quality (for offers), use those values
    // Otherwise analyze the AI response for general conversation
    if (!dealQuality) {
      // Analyze response for deal acceptance - be VERY careful of "unacceptable" etc
      const hasNegativeWords = /\b(not|never|no|nope|won't|can't|cannot|too|unacceptable)\b/i.test(aiResponse);
      const hasDealWords = /\b(deal|i'll take it|i'll take|sold|yes|accept it)\b/i.test(aiResponse);
      // Only accept if they explicitly say deal/accept AND they didn't say anything negative
      dealAccepted = hasDealWords && !hasNegativeWords;
      
      // Estimate interest change based on sentiment
      if (/love|perfect|amazing|great|wonderful|deal/i.test(aiResponse)) {
        interestChange = 15;
        if (customer.strikes > 0) customer.strikes--; // Recovery
      } else if (/good|nice|interested|close/i.test(aiResponse)) {
        interestChange = 10;
      } else if (/too much|expensive|high|budget|lower/i.test(aiResponse)) {
        interestChange = -10;
        // Don't add strike for simple negotiation, only for severe rejection
      } else if (/leaving|waste|forget it|walking|done here|goodbye|not interested/i.test(aiResponse)) {
        interestChange = -20; // Reduced severity
        customer.strikes++;
        
        // Only actually leave if they have multiple strikes AND low interest
        if ((customer.strikes >= 3 && customer.interest + interestChange < 15) || customer.interest + interestChange <= 0) {
          isLost = true;
        } else {
          // "Push back" - they are mad but not walking yet
          // Don't modify the AI response, let it speak for itself
        }
      }

      // Determine new phase
      if (isLost) {
        newPhase = 'closed'; // Mark as closed since they left
      } else if (dealAccepted) {
        newPhase = 'closed';
      } else if (/price|cost|numbers|how much|\$/i.test(aiResponse)) {
        newPhase = 'negotiation';
      }
    }

    // Parse AI response to extract and reveal customer preferences
    // Check for payment mentions (e.g., "$500/month", "$1157/mo")
    const paymentMatch = aiResponse.match(/\$\s*(\d{1,4})\s*\/\s*(month|mo)/i);
    if (paymentMatch && customer.buyerType === 'payment') {
      customer.revealedPreferences.budget = true;
    }

    // Check for cash budget mentions (e.g., "$30,000", "$50k")
    const cashMatch = aiResponse.match(/\$\s*(\d{1,3}),?(\d{3})|(\d{1,3})k/i);
    if (cashMatch && customer.buyerType === 'cash') {
      customer.revealedPreferences.budget = true;
    }

    // Check for type/category mentions (SUV, sedan, etc.)
    if (/\b(suv|sedan|truck|electric|hybrid|coupe|wagon|van|minivan)\b/i.test(aiResponse)) {
      customer.revealedPreferences.type = true;
    }

    // Check for feature mentions
    if (/\b(sporty|fuel.efficient|luxury|family|affordable|tech|spacious|reliable|safety)\b/i.test(aiResponse)) {
      customer.revealedPreferences.features = true;
    }

    // Check for specific model mentions (broader patterns)
    if (/\b(model|specific|particular|looking for)\b/i.test(aiResponse)) {
      customer.revealedPreferences.model = true;
    }

    const customerSentiment = detectSentiment(aiResponse);

    return { response: aiResponse, interestChange, dealAccepted, newPhase, isLost, customerSentiment, playerSentiment };
  } catch (e) {
    console.error('AI Request failed:', e);
    // Fallback to scripted response on API error
    const fallback = generateResponse({
      customer,
      currentCar,
      messageType: 'general',
      ...contextOverrides
    });
    return { ...fallback, playerSentiment };
  }
} // End function


function buildSystemPrompt(customer: Customer, currentCar: Car | null, instructionType?: string, scenarioData?: any): string {
  const featureList = customer.desiredFeatures.map(f => FEATURE_LABELS[f]).join(', ');
  
  let matchAnalysis = '';
  if (currentCar) {
    const categoryMatch = carMatchesCategory(currentCar, customer);
    const featureMatch = carMatchesFeatures(currentCar, customer.desiredFeatures);
    
    if (categoryMatch && featureMatch.score === 1) {
      matchAnalysis = 'MATCH_QUALITY: PERFECT. The car matches ALL requests (Category + Features). Be excited.';
    } else if (categoryMatch && featureMatch.score > 0) {
        const missing = featureMatch.missing.map(f => FEATURE_LABELS[f]).join(', ');
        matchAnalysis = `MATCH_QUALITY: PARTIAL. The Category is correct (${CATEGORY_LABELS[customer.desiredCategory]}), BUT it is missing these features: ${missing}. Acknowledge the correct type but Complain about the missing features.`;
    } else if (categoryMatch) {
       matchAnalysis = `MATCH_QUALITY: CATEGORY_ONLY. The Category is correct, but it misses ALL desired features (${featureList}). Complain about missing features.`;
    } else {
       matchAnalysis = `MATCH_QUALITY: BAD. The car is the WRONG CATEGORY entirely. wanted ${CATEGORY_LABELS[customer.desiredCategory]}, got ${currentCar.model}. Reject it.`;
    }
  }

  const carInfo = currentCar
    ? `Car shown: ${currentCar.model} ${currentCar.trim} (${currentCar.color})\n${matchAnalysis}`
    : 'No car shown yet';

  // Instructions based on Scenario/Outcome
  let instruction = 'Respond naturally to the salesperson.';
  
  if (instructionType) {
      const budgetText = customer.buyerType === 'cash' 
          ? `$${customer.budget.toLocaleString()}`
          : `$${customer.maxPayment}/month with $${customer.desiredDown.toLocaleString()} down`;

      switch (instructionType) {
          // Scenarios
          case 'take_it_success':
              instruction = "The salesperson gave you an ultimatum ('take it or leave it'). You have decided to ACCEPT it. Reluctantly agree to buy the car.";
              break;
          case 'take_it_failure':
              instruction = "The salesperson gave you an ultimatum. You REFUSE to be pressured. Tell them you are leaving and walk away angry.";
              break;
          case 'inventory_stay':
              instruction = "The salesperson admitted they don't have exactly what you want. You are disappointed but willing to see what else they have. Ask them for recommendations.";
              break;
          case 'inventory_leave':
              instruction = "The salesperson admitted they don't have what you want. You are done wasting time. Say goodbye and leave.";
              break;
          case 'credit_pushback':
              instruction = `The salesperson said you were denied credit. But you have a HUGE down payment ($${scenarioData?.offeredDown || 0}). Argue that your down payment should make a difference!`;
              break;
          case 'credit_denial':
              instruction = "The salesperson said you were denied credit. You are embarrassed/angry. Say something about it being a mistake or just leave.";
              break;
          
          // Offers
          case 'offer_wrong_type_cash':
              instruction = "The salesperson talked about monthly payments, but you are a CASH buyer. Remind them you want the total price, not payments.";
              break;
          case 'offer_wrong_type_payment':
              instruction = "The salesperson gave you a total price, but you need a monthly payment plan. Ask them for the monthly rate.";
              break;
          case 'offer_down_too_high':
              instruction = `The down payment they asked for ($${scenarioData?.offeredDown}) is too high! You only have $${scenarioData?.desiredDown}. Tell them you can't afford that down payment.`;
              break;
          case 'offer_accepted':
              instruction = "The offer is within your budget! You are happy. ACCEPT the deal enthusiastically!";
              break;
          case 'offer_close':
              instruction = "The offer is close to your budget but still a little high. Ask them to come down just a little bit more.";
              break;
          case 'offer_too_high':
              instruction = `The offer is too high. Your limit is ${budgetText}. Tell them it's out of your budget.`;
              break;
          case 'offer_way_too_high':
              instruction = `The offer is WAY too high! Your limit is ${budgetText}. You are insulted or shocked. Reject it firmly.`;
              break;
          case 'offer_budget_stretch':
              instruction = "The offer is over your budget, BUT you love the car so much you will stretch your budget. Say 'It's more than I wanted to spend, but I love it. Let's do it!'";
              break;
          case 'offer_downgrade_request':
              instruction = "The car is nice but too expensive. Tell them you need a cheaper model or lower trim level.";
              break;
          case 'customer_affirm_close':
              instruction = "You (the customer) ALREADY accepted the deal in your last message. The salesperson is asking for final confirmation. You MUST affirm the deal. Say you're ready to sign, that we have a deal, or where do I sign. Do NOT backtrack, renegotiate, or say the price is wrong.";
              break;
          
          case 'general_chat':
          default:
              instruction = "Respond naturally to the salesperson's question or statement. IF they asked about your budget, type, or needs, answer them truthfully based on your profile below.";
              break;
      }
  }

  // Special handling for diff/guarded
  const difficultInstructions = customer.isDifficult ? `
IMPORTANT - DIFFICULT CUSTOMER ATTITUDE:
- You are DIFFICULT and AVASIVE.
- If asked personal questions (budget/needs), be vague or annoyed unless you are making a deal.
- Short fuse.
` : '';

  const guardedInstructions = customer.isGuarded ? `
IMPORTANT - GUARDED CUSTOMER ATTITUDE:
- You are GUARDED. You don't trust salespeople.
- If they ask personal questions early on, say you are "just looking" or "not ready to say".
- Only reveal info if you are negotiating or they show you a car you like.
` : '';

  return `You are ${customer.name}, a car buyer.
Personality: ${customer.personality.toUpperCase()}
Satisfaction/Interest Level: ${customer.interest}% (0=Leaving, 100=Buying)
Temper: ${customer.temper}/100

${guardedInstructions}
${difficultInstructions}

YOUR TRUE PREFERENCES (Use to answer questions):
- Budget: ${customer.buyerType === 'cash' ? `$${customer.budget.toLocaleString()} cash` : `$${customer.maxPayment}/mo with $${customer.desiredDown.toLocaleString()} down`}
- Type: ${CATEGORY_LABELS[customer.desiredCategory] || "Any"}
- Features: ${featureList}
- Model Preference: ${customer.desiredModel || "None"}

CURRENT STATUS:
${carInfo}

INSTRUCTION FOR THIS RESPONSE:
${instruction}

RULES:
- Respond in 1-2 SHORT sentences.
- Speak in the first person ("I want...", "I think...").
- Match your personality (${customer.personality}).
- ${customer.interest < 30 ? "You are currently unhappy/bored. Show it." : ""}
- ${customer.interest > 80 ? "You are currently very happy/excited. Show it." : ""}
`;
}
