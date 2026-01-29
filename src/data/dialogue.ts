import type { PersonalityType, DesiredFeature, VehicleCategory } from '../types/game';

// ============ LABELS ============

export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  suv: 'an SUV',
  sedan: 'a sedan',
  electric: 'an electric car',
  affordable: 'something affordable',
  luxury: 'something luxury',
  any: '',
};

export const FEATURE_LABELS: Record<DesiredFeature, string> = {
  sporty: 'sporty',
  fuel_efficient: 'fuel efficient',
  luxury: 'luxurious',
  family: 'family-friendly',
  affordable: 'affordable',
  tech: 'high-tech',
  spacious: 'spacious',
};

export function formatFeatures(features: DesiredFeature[]): string {
  const labels = features.map((f) => FEATURE_LABELS[f]);
  if (labels.length === 1) return labels[0];
  return labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
}

// ============ SPECIAL PHRASE RESPONSES (used by resolveSpecialPhrase + buildSystemPrompt) ============

export const TAKE_IT_OR_LEAVE_IT_SUCCESS: Record<PersonalityType, string[]> = {
  friendly: [
    "Well... if that's really the only option, I guess I'll take it! It's still a nice car.",
    "Okay then! I don't want to leave empty handed. Let's do it.",
    "Fair enough. I trust you. I'll take this one.",
  ],
  serious: [
    "I see. Given the market conditions, I will accept this vehicle as the solution.",
    "Very well. If the inventory is limited, I will proceed with this purchase.",
    "Understood. Let's finalize the paperwork for this unit then.",
  ],
  skeptical: [
    "Fine. I guess I'm stuck with this one. Whatever, let's just get it over with.",
    "You're lucky I need a car today. I'll take it, but I'm not thrilled.",
    "Ugh. Fine. I'll take it.",
  ],
  enthusiastic: [
    "Okay!!! I just really want a car today! I'll take it!!",
    "If that's the only one, then it's DESTINY! Let's do it!",
    "I can't wait any longer! I'll take this one! Yay!",
  ],
  analytical: [
    "Analyzing alternatives... None available. Proceeding with current local optimum.",
    "Given the constraint of limited inventory, acceptance is the logical path.",
    "I will acquire this unit rather than restart the search process.",
  ],
};

export const TAKE_IT_OR_LEAVE_IT_FAILURE: Record<PersonalityType, string[]> = {
  friendly: [
    "I understand, but I just can't settle for something I don't love. Sorry!",
    "If that's all you have, I think I better keep looking elsewhere. Thanks anyway!",
    "Ah that's a shame. I really need something else. Bye!",
  ],
  serious: [
    "Then we have nothing more to discuss. Good day.",
    "That is unacceptable. I will find a dealership with better stock.",
    "I am not one to settle. Goodbye.",
  ],
  skeptical: [
    "Wow. 'That's all you have'? What a joke. I'm leaving.",
    "I knew this place was a waste of time. Don't bother calling me back.",
    "Yeah, right. I'm not buying your leftovers. See ya.",
  ],
  enthusiastic: [
    "But I don't want thiiiis one! I'm so sad! I have to go!",
    "Noooo! I can't believe that's it! I'm leaving!",
    "Aww! I guess I won't get a car today after all. Bye!",
  ],
  analytical: [
    "Inventory constraints prevent optimal matching. Terminating process.",
    "Current option does not meet threshold criteria. Aborting.",
    "Insufficient selection. I will conduct business elsewhere.",
  ],
};

export const INVENTORY_ADMISSION_SUCCESS: Record<PersonalityType, string[]> = {
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

export const INVENTORY_ADMISSION_FAILURE: Record<PersonalityType, string[]> = {
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
