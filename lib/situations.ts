export type Situation = {
  categories: string[];
  group: string;
  heading: string;
  keywords: string[];
  prompt: string;
  slug: string;
  subheading: string;
  title: string;
};

export const SITUATIONS: Situation[] = [
  {
    categories: ["car_rental", "travel", "insurance"],
    group: "Travel",
    heading: "Renting a car?",
    keywords: ["rental car", "collision", "damage waiver", "cdw", "car"],
    prompt: "I'm renting a car. What benefits can I use?",
    slug: "renting-a-car",
    subheading:
      "Check what your cards and memberships already cover before you pay for the rental company's insurance.",
    title: "Renting a car",
  },
  {
    categories: ["travel", "loyalty"],
    group: "Travel",
    heading: "Booking a hotel?",
    keywords: ["hotel", "stay", "loyalty", "elite"],
    prompt: "I'm booking a hotel. What benefits can I use?",
    slug: "booking-a-hotel",
    subheading:
      "See the hotel credits, status benefits, and booking perks you already have.",
    title: "Booking a hotel",
  },
  {
    categories: ["lounge", "travel"],
    group: "Travel",
    heading: "At the airport?",
    keywords: ["lounge", "airport", "priority pass"],
    prompt: "I'm at the airport and want lounge access.",
    slug: "airport-lounge",
    subheading:
      "Find the lounge access and expedited security you already have.",
    title: "Airport lounge",
  },
  {
    categories: ["insurance", "travel"],
    group: "Travel",
    heading: "Flight delayed or canceled?",
    keywords: ["trip delay", "delay", "cancellation", "insurance"],
    prompt: "My flight was delayed or canceled.",
    slug: "flight-delay",
    subheading: "See the trip delay and interruption coverage in your profile.",
    title: "Flight delay",
  },
  {
    categories: ["insurance", "travel"],
    group: "Travel",
    heading: "Lost luggage?",
    keywords: ["luggage", "baggage", "lost", "insurance"],
    prompt: "My luggage was lost or delayed.",
    slug: "lost-luggage",
    subheading: "Check the baggage coverage that may apply.",
    title: "Lost luggage",
  },
  {
    categories: ["shopping", "everyday", "security"],
    group: "Shopping",
    heading: "Buying a new phone?",
    keywords: [
      "phone",
      "purchase protection",
      "warranty",
      "cell phone protection",
    ],
    prompt: "I'm buying a new phone. Help me use the benefits I already have.",
    slug: "buying-a-phone",
    subheading:
      "Check what your existing cards, memberships, insurance, and carrier already cover.",
    title: "Buying a phone",
  },
  {
    categories: ["shopping"],
    group: "Shopping",
    heading: "Buying a laptop or electronics?",
    keywords: ["laptop", "computer", "warranty", "purchase protection"],
    prompt: "I'm buying a laptop. What benefits can I use?",
    slug: "buying-a-laptop",
    subheading:
      "Purchase protection and extended warranty can cover new electronics.",
    title: "Buying a laptop",
  },
  {
    categories: ["shopping"],
    group: "Shopping",
    heading: "Making a large purchase?",
    keywords: ["purchase protection", "warranty", "large purchase"],
    prompt: "I'm making a large purchase. What protection do I have?",
    slug: "large-purchase",
    subheading:
      "See the purchase protection and warranty coverage tied to your cards.",
    title: "Large purchase",
  },
  {
    categories: ["shopping"],
    group: "Shopping",
    heading: "Returning something?",
    keywords: ["return protection", "returns"],
    prompt: "I need to return something I bought.",
    slug: "returning-something",
    subheading: "Some cards include return protection on eligible purchases.",
    title: "Returning something",
  },
  {
    categories: ["travel", "dining"],
    group: "Transportation",
    heading: "Using Uber or Lyft?",
    keywords: ["uber", "lyft", "rideshare", "uber cash"],
    prompt: "How can I save on Uber and Lyft?",
    slug: "rideshare",
    subheading: "Monthly rideshare credits can offset the cost of rides.",
    title: "Uber and Lyft",
  },
  {
    categories: ["everyday", "rewards"],
    group: "Transportation",
    heading: "Paying for gas?",
    keywords: ["gas", "fuel", "ev charging"],
    prompt: "How can I save on gas?",
    slug: "gas-and-ev",
    subheading: "See which card earns the most at the pump.",
    title: "Gas and EV charging",
  },
  {
    categories: ["dining"],
    group: "Food",
    heading: "Dining out?",
    keywords: ["restaurant", "dining credit", "dining"],
    prompt: "Where can I save on dining?",
    slug: "dining",
    subheading: "Dining credits and bonus categories you already have.",
    title: "Dining",
  },
  {
    categories: ["rewards", "everyday"],
    group: "Food",
    heading: "Grocery shopping?",
    keywords: ["grocery", "supermarket", "costco", "wholesale"],
    prompt: "What card should I use for groceries?",
    slug: "grocery-shopping",
    subheading: "Pick the card that earns the most at the grocery store.",
    title: "Grocery shopping",
  },
  {
    categories: ["dining"],
    group: "Food",
    heading: "Ordering food delivery?",
    keywords: ["doordash", "uber eats", "grubhub", "delivery"],
    prompt: "How can I save on food delivery?",
    slug: "food-delivery",
    subheading: "Delivery memberships and monthly credits in your profile.",
    title: "Food delivery",
  },
  {
    categories: ["streaming"],
    group: "Entertainment",
    heading: "Paying for streaming?",
    keywords: ["streaming", "netflix", "hulu", "disney plus", "music"],
    prompt: "What streaming benefits do I have?",
    slug: "streaming",
    subheading:
      "Some memberships bundle streaming services, and some cards credit them.",
    title: "Streaming",
  },
  {
    categories: ["everyday", "shopping"],
    group: "Emergencies",
    heading: "Dropped your phone?",
    keywords: ["phone", "cracked screen", "damage", "cell phone protection"],
    prompt: "I dropped my phone. What can I use?",
    slug: "phone-damage",
    subheading: "Cell phone protection and purchase protection may apply.",
    title: "Phone damage",
  },
  {
    categories: ["everyday", "security"],
    group: "Emergencies",
    heading: "Lost or stolen phone?",
    keywords: ["phone", "theft", "lost", "cell phone protection"],
    prompt: "My phone was lost or stolen. What can I use?",
    slug: "lost-phone",
    subheading: "See the cell phone and purchase protection in your profile.",
    title: "Lost phone",
  },
  {
    categories: ["shopping"],
    group: "Emergencies",
    heading: "Something you bought was stolen?",
    keywords: ["theft", "stolen", "purchase protection"],
    prompt: "Something I bought was stolen. What protection do I have?",
    slug: "purchase-stolen",
    subheading: "Purchase protection can cover theft on eligible items.",
    title: "Purchase stolen",
  },
];

export function getSituation(slug: string) {
  return SITUATIONS.find((situation) => situation.slug === slug) ?? null;
}

export const SITUATION_GROUPS = [
  "Travel",
  "Shopping",
  "Transportation",
  "Food",
  "Entertainment",
  "Emergencies",
];
