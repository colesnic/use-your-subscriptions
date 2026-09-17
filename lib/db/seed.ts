// biome-ignore-all lint/performance/noAwaitInLoops: seeding is intentionally sequential
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { ANONYMOUS_USER_ID } from "../constants";
import {
  benefit,
  provider,
  providerRelation,
  user,
  userSubscription,
} from "./schema";

config({
  path: ".env.local",
});

const client = createClient({
  authToken: process.env.DATABASE_AUTH_TOKEN,
  url: process.env.DATABASE_URL ?? "file:./local.db",
});
const db = drizzle(client);

type SeedBenefit = {
  category: string;
  details: string;
  howToUse?: string;
  sourceUrl?: string;
  summary: string;
  tags: string[];
  title: string;
  value?: string;
};

type SeedProvider = {
  annualFee?: number;
  benefits: SeedBenefit[];
  category: "credit_card" | "membership" | "loyalty" | "insurance";
  description: string;
  issuer?: string;
  name: string;
  section:
    | "grocery"
    | "credit_card"
    | "travel"
    | "work"
    | "security"
    | "streaming"
    | "phone"
    | "everyday";
  slug: string;
  website?: string;
};

const providers: SeedProvider[] = [
  {
    annualFee: 85_000,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 5x points on flights booked directly with airlines or through American Express Travel (up to $500,000 in these purchases per calendar year) and 5x points on prepaid hotels booked through American Express Travel. All other purchases earn 1x points.",
        summary:
          "5x on flights (direct or Amex Travel, up to $500k/yr) and prepaid Amex Travel hotels; 1x on everything else.",
        tags: ["points", "earning", "5x flights", "5x hotels", "amex travel"],
        title: "Earning rates",
        value: "5x travel / 1x other",
      },
      {
        category: "car_rental",
        details:
          "The Platinum Card includes complimentary elite status with several rental car programs: Hertz Gold Plus Rewards President's Circle, Avis Preferred Plus, and National Emerald Club Executive. These give you faster pick-up (skip the counter), a wider choice of vehicles, and potential upgrades.",
        howToUse:
          "Enroll each program once via the Amex benefits portal, then add your membership number to your rental profile. Status is valid while you hold the card.",
        summary:
          "Complimentary elite status with Hertz (President's Circle), Avis (Preferred Plus), and National (Emerald Club Executive).",
        tags: [
          "rental car",
          "hertz",
          "avis",
          "national",
          "elite status",
          "upgrade",
          "skip the line",
        ],
        title: "Rental car elite status (Hertz, Avis, National)",
      },
      {
        category: "car_rental",
        details:
          "Amex provides Car Rental Loss and Damage Insurance when you charge the entire rental to the card and decline the rental company's collision damage waiver. Within the U.S. it is secondary to your personal auto insurance; outside the U.S. it is primary. Coverage is for damage/theft of the rental vehicle, not liability.",
        howToUse:
          "Pay for the rental with the Platinum Card and decline the rental company's CDW/LDW. Coverage is automatic; file a claim through Amex if damage occurs.",
        sourceUrl:
          "https://www.americanexpress.com/en-us/benefits/insurance/car-rental-insurance/",
        summary:
          "Automatic rental car loss and damage coverage when you pay with the card and decline the rental company's insurance.",
        tags: [
          "rental car",
          "insurance",
          "collision",
          "damage waiver",
          "primary",
          "secondary",
        ],
        title: "Car Rental Loss and Damage Insurance",
        value: "Secondary in the U.S., primary abroad",
      },
      {
        category: "travel",
        details:
          "Book through Amex Travel's Fine Hotels + Resorts or The Hotel Collection to get a $200 annual statement credit on prepaid FHR/The Hotel Collection stays, plus room upgrades when available, daily breakfast for two, and guaranteed 4pm late checkout at FHR properties.",
        howToUse:
          "Book a prepaid stay at a Fine Hotels + Resorts or The Hotel Collection property through Amex Travel.",
        summary:
          "$200 annual credit on prepaid Fine Hotels + Resorts or The Hotel Collection bookings, plus perks like upgrades and late checkout.",
        tags: [
          "hotel",
          "travel",
          "fine hotels",
          "upgrade",
          "breakfast",
          "credit",
        ],
        title: "Fine Hotels + Resorts / Hotel Collection credit",
        value: "$200/year",
      },
      {
        category: "travel",
        details:
          "$200 in airline fee credits each calendar year for incidental fees (checked bags, seat assignments, in-flight food/drinks) on your selected qualifying airline. Airfare itself does not qualify.",
        howToUse:
          "Choose one qualifying airline in your Amex account, then pay incidentals with the card.",
        summary:
          "$200 annual credit toward incidental airline fees on one selected airline.",
        tags: ["airline", "checked bag", "incidentals", "travel", "credit"],
        title: "Airline fee credit",
        value: "$200/year",
      },
      {
        category: "travel",
        details:
          "$15 in Uber Cash each month, plus a $35 bonus in December, for rides and Uber Eats in the U.S. Add the Platinum Card as a payment method in the Uber app to receive it.",
        howToUse:
          "Add the card as the payment method in the Uber app; the credit loads automatically each month.",
        summary: "$15/month Uber Cash plus a $35 December bonus.",
        tags: ["uber", "rideshare", "uber eats", "credit", "monthly"],
        title: "Uber Cash",
        value: "$200/year total",
      },
      {
        category: "lounge",
        details:
          "Access to the Global Lounge Collection, including Centurion Lounges, Priority Pass Select, Delta Sky Club (when flying Delta), and International American Express Lounges. Enrollment may be required for some programs.",
        howToUse:
          "Enroll in Priority Pass Select through Amex, then show your card and boarding pass at eligible lounges.",
        summary:
          "Global Lounge Collection access, including Centurion Lounges and Priority Pass Select.",
        tags: ["lounge", "airport", "priority pass", "centurion", "travel"],
        title: "Airport lounge access",
      },
      {
        category: "security",
        details:
          "Up to $100 statement credit every 4 years for Global Entry, or up to $85 for TSA PreCheck, when you pay the application fee with the card.",
        summary:
          "Statement credit for Global Entry or TSA PreCheck application fees.",
        tags: ["global entry", "tsa precheck", "security", "airport", "credit"],
        title: "Global Entry / TSA PreCheck credit",
        value: "Up to $100 every 4 years",
      },
      {
        category: "everyday",
        details:
          "Up to $199 annual statement credit for a CLEAR Plus membership, which lets you verify your identity with your eyes or fingerprint to skip security lines at airports and stadiums.",
        summary: "Annual statement credit for a CLEAR Plus membership.",
        tags: ["clear", "security", "airport", "biometric", "credit"],
        title: "CLEAR Plus credit",
        value: "Up to $199/year",
      },
      {
        category: "shopping",
        details:
          "New purchases are covered against accidental damage or theft for 90 days, up to $10,000 per occurrence and $50,000 per year. A phone bought with the card is covered if it is stolen or damaged soon after purchase.",
        howToUse:
          "Pay for the item with the card, then file a claim through Amex within 90 days if it is damaged or stolen.",
        summary:
          "New purchases, including a phone, are covered against theft or damage for 90 days.",
        tags: [
          "purchase protection",
          "phone",
          "theft",
          "damage",
          "new purchase",
          "shopping",
          "dropped",
          "broken",
        ],
        title: "Purchase Protection",
        value: "Up to $10,000 per claim",
      },
      {
        category: "shopping",
        details:
          "Eligible items get up to one extra year added to the manufacturer's warranty when the full purchase is made with the card, on warranties of five years or less.",
        summary:
          "Adds up to one extra year to the manufacturer's warranty on eligible purchases.",
        tags: [
          "extended warranty",
          "warranty",
          "phone",
          "electronics",
          "repair",
        ],
        title: "Extended Warranty",
        value: "Up to 1 extra year",
      },
      {
        category: "everyday",
        details:
          "Pay your monthly cell phone bill with the card and get up to $800 per claim ($1,600 per year, $50 deductible) if your phone is damaged or stolen.",
        howToUse:
          "Set the card as the payment method for your monthly wireless bill to activate coverage.",
        summary:
          "Covers a damaged or stolen phone (up to $800 per claim) when you pay your monthly cell bill with the card.",
        tags: [
          "cell phone protection",
          "phone",
          "cracked screen",
          "theft",
          "cell bill",
          "dropped",
          "broken",
          "damaged",
        ],
        title: "Cell Phone Protection",
        value: "Up to $800 per claim",
      },
    ],
    category: "credit_card",
    description:
      "Premium travel card with lounge access, annual credits, and elite status with several rental car and hotel programs.",
    issuer: "American Express",
    name: "American Express Platinum Card",
    section: "credit_card",
    slug: "amex-platinum",
    website: "https://www.americanexpress.com/us/credit-cards/card/platinum/",
  },
  {
    annualFee: 55_000,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 8x points on purchases through Chase Travel (including The Edit) and 4x points on flights and hotels booked directly with the airline or hotel. Earn 3x points on dining worldwide and 1x on all other purchases.",
        summary:
          "8x Chase Travel, 4x direct flights/hotels, 3x dining, 1x other.",
        tags: [
          "points",
          "earning",
          "8x chase travel",
          "4x flights",
          "3x dining",
        ],
        title: "Earning rates",
        value: "8x Chase Travel",
      },
      {
        category: "car_rental",
        details:
          "Auto Rental Collision Damage Waiver is primary coverage (it pays before your personal auto insurance) for damage or theft of a rental vehicle when you charge the rental to the card and decline the rental company's collision damage waiver. Coverage is up to the actual cash value of the vehicle, generally up to $75,000, and applies in the U.S. and abroad. It does not cover liability.",
        howToUse:
          "Charge the full rental to the card and decline the rental company's CDW/LDW. Coverage is automatic.",
        sourceUrl:
          "https://www.chase.com/personal/credit-cards/education/benefits/sapphire-reserve-auto-rental-collision-damage-waiver",
        summary:
          "Primary rental car collision damage waiver up to $75,000 when you pay with the card and decline the rental company's insurance.",
        tags: [
          "rental car",
          "insurance",
          "primary",
          "collision",
          "damage waiver",
          "car rental",
        ],
        title: "Primary Auto Rental Collision Damage Waiver",
        value: "Up to $75,000",
      },
      {
        category: "travel",
        details:
          "Earn a $300 annual statement credit for travel purchases, automatically applied to purchases coded as travel (airfare, hotels, rental cars, transit, etc.).",
        howToUse: "Automatic — just use the card for travel purchases.",
        summary:
          "$300 annual statement credit that automatically applies to travel purchases.",
        tags: ["travel", "credit", "airfare", "hotel", "rental car"],
        title: "$300 annual travel credit",
        value: "$300/year",
      },
      {
        category: "lounge",
        details:
          "Priority Pass Select membership with access to 1,300+ airport lounges worldwide, plus access to Chase Sapphire Lounges by The Club and select restaurants via the Priority Pass network.",
        howToUse:
          "Activate Priority Pass through the Chase benefits portal, then present your Priority Pass card or digital pass.",
        summary: "Priority Pass Select plus access to Chase Sapphire Lounges.",
        tags: ["lounge", "priority pass", "airport", "travel"],
        title: "Airport lounge access",
      },
      {
        category: "insurance",
        details:
          "Trip cancellation/interruption coverage up to $10,000 per person and $20,000 per trip when you pay for the trip with the card. Also includes baggage delay, lost luggage, and trip delay reimbursement.",
        summary:
          "Trip cancellation/interruption up to $10,000 per person, plus baggage and trip delay coverage.",
        tags: [
          "trip cancellation",
          "trip delay",
          "baggage",
          "insurance",
          "travel",
        ],
        title: "Trip protection",
        value: "Up to $10,000 per person",
      },
      {
        category: "dining",
        details:
          "Complimentary DoorDash DashPass membership (activate by a set date) and monthly DoorDash credits for eligible purchases, plus other rotating dining offers.",
        summary:
          "Complimentary DashPass membership and monthly DoorDash credits.",
        tags: ["doordash", "dashpass", "dining", "delivery", "credit"],
        title: "DoorDash DashPass and credits",
      },
      {
        category: "security",
        details:
          "Up to $100 statement credit every 4 years for Global Entry, or up to $85 for TSA PreCheck, when you pay the application fee with the card.",
        summary: "Global Entry or TSA PreCheck application fee credit.",
        tags: ["global entry", "tsa precheck", "security", "credit"],
        title: "Global Entry / TSA PreCheck credit",
        value: "Up to $100 every 4 years",
      },
      {
        category: "shopping",
        details:
          "New purchases are covered against damage or theft for 120 days, up to $10,000 per claim and $50,000 per account. A phone bought with the card is covered if it is damaged or stolen soon after purchase.",
        howToUse:
          "Pay for the item with the card, then file a claim through Chase within 120 days if it is damaged or stolen.",
        summary:
          "New purchases, including a phone, are covered against damage or theft for 120 days.",
        tags: [
          "purchase protection",
          "phone",
          "theft",
          "damage",
          "new purchase",
          "shopping",
          "dropped",
          "broken",
        ],
        title: "Purchase Protection",
        value: "Up to $10,000 per claim",
      },
      {
        category: "shopping",
        details:
          "Extends the manufacturer's warranty by up to one additional year on eligible purchases with warranties of three years or less.",
        summary:
          "Adds up to one extra year to the manufacturer's warranty on eligible purchases.",
        tags: [
          "extended warranty",
          "warranty",
          "phone",
          "electronics",
          "repair",
        ],
        title: "Extended Warranty",
        value: "Up to 1 extra year",
      },
      {
        category: "everyday",
        details:
          "Pay your monthly cell phone bill with the card and get up to $1,000 per claim ($1,500 per year, $50 deductible) if your phone is damaged or stolen.",
        howToUse:
          "Set the card as the payment method for your monthly wireless bill to activate coverage.",
        summary:
          "Covers a damaged or stolen phone (up to $1,000 per claim) when you pay your monthly cell bill with the card.",
        tags: [
          "cell phone protection",
          "phone",
          "cracked screen",
          "theft",
          "cell bill",
          "dropped",
          "broken",
          "damaged",
        ],
        title: "Cell Phone Protection",
        value: "Up to $1,000 per claim",
      },
    ],
    category: "credit_card",
    description:
      "Travel-focused card known for primary rental car insurance, a broad annual travel credit, and lounge access.",
    issuer: "Chase",
    name: "Chase Sapphire Reserve",
    section: "credit_card",
    slug: "chase-sapphire-reserve",
    website:
      "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
  },
  {
    annualFee: 39_500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 10x miles on hotels and rental cars booked through Capital One Travel, 5x miles on flights and vacation rentals booked through Capital One Travel, and an unlimited 2x miles on all other purchases.",
        summary:
          "10x hotels/rental cars and 5x flights via Capital One Travel; 2x on everything else.",
        tags: ["miles", "earning", "10x hotels", "5x flights", "2x everything"],
        title: "Earning rates",
        value: "2x everything / 10x travel",
      },
      {
        category: "car_rental",
        details:
          "Primary rental car insurance for damage or theft of a rental vehicle when you charge the rental to the card and decline the rental company's collision damage waiver. Applies to most rental cars worldwide; excludes exotic/expensive vehicles.",
        howToUse: "Pay with the card and decline the rental company's CDW/LDW.",
        summary:
          "Primary rental car collision damage coverage when you pay with the card and decline the rental company's insurance.",
        tags: [
          "rental car",
          "insurance",
          "primary",
          "collision",
          "damage waiver",
        ],
        title: "Primary rental car insurance",
      },
      {
        category: "travel",
        details:
          "$300 annual credit for bookings made through Capital One Travel (flights, hotels, rental cars).",
        howToUse: "Book through Capital One Travel and pay with the card.",
        summary: "$300 annual credit for Capital One Travel bookings.",
        tags: ["travel", "credit", "capital one travel", "hotel", "airfare"],
        title: "$300 annual travel credit",
        value: "$300/year",
      },
      {
        category: "lounge",
        details:
          "Access to Capital One Lounges and 1,300+ Priority Pass lounges worldwide. Cardholders can bring guests at Capital One Lounges for a fee.",
        summary: "Capital One Lounge and Priority Pass lounge access.",
        tags: ["lounge", "priority pass", "airport", "capital one lounge"],
        title: "Airport lounge access",
      },
      {
        category: "security",
        details:
          "Up to $100 statement credit for Global Entry or TSA PreCheck when you pay the application fee with the card (once every 4 years).",
        summary: "Global Entry or TSA PreCheck application fee credit.",
        tags: ["global entry", "tsa precheck", "security", "credit"],
        title: "Global Entry / TSA PreCheck credit",
      },
      {
        category: "travel",
        details:
          "Receive 10,000 bonus miles every account anniversary, which can be worth roughly $100+ toward travel.",
        summary: "10,000 bonus miles every account anniversary.",
        tags: ["miles", "anniversary", "rewards", "travel"],
        title: "Anniversary bonus miles",
      },
      {
        category: "everyday",
        details:
          "Pay your monthly cell phone bill with the card and get up to $800 per claim ($1,000 per year, $50 deductible) if your phone is damaged or stolen.",
        howToUse:
          "Set the card as the payment method for your monthly wireless bill to activate coverage.",
        summary:
          "Covers a damaged or stolen phone (up to $800 per claim) when you pay your monthly cell bill with the card.",
        tags: [
          "cell phone protection",
          "phone",
          "cracked screen",
          "theft",
          "cell bill",
          "dropped",
          "broken",
          "damaged",
        ],
        title: "Cell Phone Protection",
        value: "Up to $800 per claim",
      },
    ],
    category: "credit_card",
    description:
      "Premium travel card with a straightforward travel credit, anniversary miles, lounge access, and primary rental car insurance.",
    issuer: "Capital One",
    name: "Capital One Venture X Rewards Credit Card",
    section: "credit_card",
    slug: "capital-one-venture-x",
    website: "https://www.capitalone.com/credit-cards/venture-x/",
  },
  {
    annualFee: 19_900,
    benefits: [
      {
        category: "security",
        details:
          "Use your eyes or fingerprint to verify your identity at CLEAR pods and skip the document-check portion of the security line at 55+ U.S. airports and many stadiums and venues. You still go through the physical screening checkpoint.",
        howToUse:
          "Enroll online or at a CLEAR pod, complete identity verification, then use the CLEAR lane at participating airports.",
        summary:
          "Skip the ID-check line at 55+ airports and select venues using biometric verification.",
        tags: [
          "airport",
          "security",
          "tsa",
          "biometric",
          "skip the line",
          "travel",
        ],
        title: "Skip the security line at airports",
      },
      {
        category: "security",
        details:
          "Add family members or travel companions to your CLEAR account (pricing varies; children under 18 are free with an adult member).",
        summary:
          "Add family members or travel companions to your account; kids under 18 free with an adult.",
        tags: ["family", "add member", "airport", "security"],
        title: "Family members and companions",
      },
    ],
    category: "membership",
    description:
      "Biometric identity membership that lets you skip the ID check line at airports, stadiums, and other venues.",
    issuer: "CLEAR",
    name: "CLEAR Plus",
    section: "travel",
    slug: "clear-plus",
    website: "https://www.clearme.com/",
  },
  {
    annualFee: 13_000,
    benefits: [
      {
        category: "shopping",
        details:
          "Executive members earn a 2% annual reward on most Costco and Costco.com purchases (some exclusions), paid as a reward certificate. The reward is capped at $1,250 per year.",
        summary:
          "2% annual reward on most Costco purchases, up to $1,250/year.",
        tags: ["reward", "cash back", "shopping", "warehouse", "annual"],
        title: "2% annual reward",
        value: "Up to $1,250/year",
      },
      {
        category: "car_rental",
        details:
          "Costco Travel offers member-only rental car rates with major agencies (Enterprise, Alamo, National, Budget, Avis, Hertz). Rates often include a free additional driver and there is no booking fee, plus you can stack your credit card's rental car insurance.",
        howToUse:
          "Book through Costco Travel, then pay with a card that offers rental car insurance and decline the rental company's CDW.",
        summary:
          "Member-only rental car rates with no booking fees and often a free additional driver.",
        tags: [
          "rental car",
          "costco travel",
          "car rental",
          "discount",
          "additional driver",
        ],
        title: "Costco Travel rental car rates",
      },
      {
        category: "travel",
        details:
          "Costco Travel packages for hotels, cruises, and vacation rentals often include Costco Shop Cards or extra perks. Executive members also earn the 2% annual reward on eligible travel purchases.",
        summary:
          "Member pricing and perks on Costco Travel hotel, cruise, and vacation packages.",
        tags: ["travel", "hotel", "cruise", "vacation", "costco travel"],
        title: "Costco Travel packages",
      },
      {
        category: "everyday",
        details:
          "Discounted gasoline at Costco gas stations (typically among the lowest locally) and Costco's Concierge tech support and extended warranty on many electronics.",
        summary:
          "Discounted gas plus free tech support and extended warranty on many electronics.",
        tags: ["gas", "fuel", "electronics", "warranty", "concierge"],
        title: "Gas discounts and Concierge services",
      },
    ],
    category: "membership",
    description:
      "Warehouse membership with annual rewards, discounted gas, and access to Costco Travel (including rental car discounts).",
    issuer: "Costco",
    name: "Costco Executive Membership",
    section: "grocery",
    slug: "costco-executive",
    website: "https://www.costco.com/join-costco.html",
  },
  {
    annualFee: 6500,
    benefits: [
      {
        category: "shopping",
        details:
          "Shop the warehouse and Costco.com with member-only pricing on groceries, electronics, appliances, and more. Gold Star covers the member plus a free household card for one other person at the same address.",
        howToUse:
          "Show your membership card (or the Costco app) at the door and at checkout.",
        summary:
          "Warehouse and Costco.com access with member-only pricing, plus a free household card.",
        tags: ["warehouse", "grocery", "member pricing", "household card"],
        title: "Warehouse access and member pricing",
      },
      {
        category: "car_rental",
        details:
          "Costco Travel offers member-only rental car rates with major agencies (Enterprise, Alamo, National, Budget, Avis, Hertz). Rates often include a free additional driver and there is no booking fee, and you can still stack your credit card's rental car insurance.",
        howToUse:
          "Book through Costco Travel, pay with a card that offers rental car insurance, and decline the rental company's CDW.",
        summary:
          "Member-only rental car rates with no booking fees and often a free additional driver.",
        tags: [
          "rental car",
          "costco travel",
          "car rental",
          "discount",
          "additional driver",
        ],
        title: "Costco Travel rental car rates",
      },
      {
        category: "everyday",
        details:
          "Discounted gasoline at Costco gas stations, plus member pricing at the pharmacy, optical, and hearing aid centers. Includes Costco Concierge free tech support and extended warranty on many electronics.",
        summary:
          "Discounted gas, pharmacy and optical savings, plus free tech support and extended warranty.",
        tags: ["gas", "fuel", "pharmacy", "optical", "warranty", "concierge"],
        title: "Gas, pharmacy, and Concierge services",
      },
    ],
    category: "membership",
    description:
      "Costco's base warehouse membership: member pricing, discounted gas, and Costco Travel. Does not include the 2% Executive annual reward.",
    issuer: "Costco",
    name: "Costco Gold Star Membership",
    section: "grocery",
    slug: "costco-gold-star",
    website: "https://www.costco.com/join-costco.html",
  },
  {
    annualFee: 6500,
    benefits: [
      {
        category: "car_rental",
        details:
          "Members get discounts at Hertz, Avis, and other rental agencies, often with no additional-driver fee for a spouse or domestic partner and member-only rates. AAA also offers its own 'Show Your Card & Save' discounts.",
        howToUse:
          "Show your AAA card or use the AAA discount code when booking with a participating rental agency.",
        summary:
          "Member discounts at Hertz, Avis, and other rental agencies, often including a free additional driver.",
        tags: [
          "rental car",
          "discount",
          "hertz",
          "avis",
          "additional driver",
          "aaa",
        ],
        title: "Rental car discounts",
      },
      {
        category: "insurance",
        details:
          "Roadside assistance including towing, jump-starts, flat tire changes, lockout service, and fuel delivery. Coverage limits and number of service calls depend on your membership tier (Classic, Plus, Premier).",
        howToUse:
          "Call the AAA roadside number or use the app when you need help; the responding provider bills AAA directly.",
        summary:
          "Roadside assistance: towing, jump-starts, tire changes, lockouts, and fuel delivery.",
        tags: [
          "roadside",
          "towing",
          "jump start",
          "flat tire",
          "lockout",
          "car",
        ],
        title: "Roadside assistance",
      },
      {
        category: "travel",
        details:
          "AAA members get discounts on hotels, cruises, and attractions, plus access to AAA travel agents and free maps/TripTiks.",
        summary:
          "Discounts on hotels, cruises, and attractions, plus trip planning resources.",
        tags: ["hotel", "cruise", "discount", "travel", "tripptik"],
        title: "Travel discounts and planning",
      },
    ],
    category: "membership",
    description:
      "Roadside assistance and travel membership with discounts at hotels, rental cars, and attractions.",
    issuer: "AAA",
    name: "AAA Membership",
    section: "travel",
    slug: "aaa-membership",
    website: "https://www.aaa.com/",
  },
  {
    annualFee: 11_000,
    benefits: [
      {
        category: "shopping",
        details:
          "Plus members get free shipping on most online orders, free curbside pickup, early shopping hours, and 2% Sam's Cash on qualifying purchases.",
        howToUse:
          "Scan your membership at checkout. Sam's Cash accumulates and can be redeemed in-club or online.",
        summary:
          "Free shipping, early shopping hours, and 2% Sam's Cash on qualifying purchases.",
        tags: [
          "warehouse",
          "free shipping",
          "cash back",
          "early shopping",
          "sams cash",
        ],
        title: "Free shipping and Sam's Cash",
        value: "2% Sam's Cash",
      },
      {
        category: "everyday",
        details:
          "Members save on fuel at Sam's Club gas stations and get member pricing at the pharmacy and optical centers.",
        summary: "Discounted fuel plus pharmacy and optical member pricing.",
        tags: ["fuel", "gas", "pharmacy", "optical", "discount"],
        title: "Fuel and pharmacy savings",
      },
    ],
    category: "membership",
    description:
      "Warehouse club membership with free shipping, early shopping hours, and fuel savings.",
    issuer: "Sam's Club",
    name: "Sam's Club Plus Membership",
    section: "grocery",
    slug: "sams-club-plus",
    website: "https://www.samsclub.com/join",
  },
  {
    annualFee: 13_900,
    benefits: [
      {
        category: "shopping",
        details:
          "Free fast delivery on millions of items, plus access to Prime Video, Prime Music, Prime Reading, and Prime Gaming.",
        howToUse:
          "Sign in and look for the Prime badge on eligible items, or open the Prime Video app.",
        summary:
          "Free fast shipping plus Prime Video, Music, Reading, and Gaming.",
        tags: [
          "shipping",
          "prime video",
          "prime music",
          "streaming",
          "delivery",
        ],
        title: "Free shipping and Prime Video",
      },
      {
        category: "shopping",
        details:
          "Prime members get exclusive Whole Foods Market deals and Amazon Fresh grocery discounts, plus savings on prescriptions through Amazon Pharmacy and RxPass.",
        summary:
          "Exclusive Whole Foods and Amazon Fresh deals, plus pharmacy savings.",
        tags: ["whole foods", "grocery", "amazon fresh", "pharmacy", "rxpass"],
        title: "Grocery and pharmacy savings",
      },
    ],
    category: "membership",
    description:
      "Shipping, streaming, and grocery perks bundled into one subscription.",
    issuer: "Amazon",
    name: "Amazon Prime",
    section: "grocery",
    slug: "amazon-prime",
    website: "https://www.amazon.com/prime",
  },
  {
    annualFee: 9900,
    benefits: [
      {
        category: "shopping",
        details:
          "Free delivery on orders over $35, reduced service fees, and 5% back on eligible pickup orders. Benefits can be shared with one family account.",
        howToUse:
          "Link the membership to your Instacart account and choose Instacart+ at checkout.",
        summary:
          "Free delivery over $35 and reduced service fees, shareable with family.",
        tags: ["grocery", "delivery", "free delivery", "pickup", "instacart"],
        title: "Free grocery delivery",
      },
    ],
    category: "membership",
    description:
      "Delivery membership for same-day groceries and household essentials.",
    issuer: "Instacart",
    name: "Instacart+",
    section: "grocery",
    slug: "instacart-plus",
    website: "https://www.instacart.com/instacart-plus",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "Redeem points for free nights, and get every fifth consecutive night free on award stays. Members also get member-only rates and free Wi-Fi.",
        howToUse:
          "Join for free, then book direct with Marriott and select the member rate.",
        summary:
          "Fifth night free on award stays, member rates, and free Wi-Fi.",
        tags: ["hotel", "free night", "fifth night free", "points", "marriott"],
        title: "Fifth night free on award stays",
      },
    ],
    category: "loyalty",
    description: "Marriott's loyalty program spanning 30+ hotel brands.",
    issuer: "Marriott",
    name: "Marriott Bonvoy",
    section: "travel",
    slug: "marriott-bonvoy",
    website: "https://www.marriott.com/loyalty.mi",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "Points do not expire with account activity, and reward stays of five or more nights get the fifth night free. Members get member discounts, free Wi-Fi, digital check-in, and room selection.",
        howToUse:
          "Join for free, book direct, and choose the member rate; use the app for digital check-in.",
        summary:
          "Fifth night free on reward stays, member discounts, and digital check-in.",
        tags: [
          "hotel",
          "points",
          "fifth night free",
          "digital check-in",
          "hilton",
        ],
        title: "Fifth night free on reward stays",
      },
    ],
    category: "loyalty",
    description: "Hilton's loyalty program across 20+ hotel brands.",
    issuer: "Hilton",
    name: "Hilton Honors",
    section: "travel",
    slug: "hilton-honors",
    website: "https://www.hilton.com/en/hilton-honors/",
  },
  {
    annualFee: 69_500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 5x points on flights and prepaid hotels booked through American Express Travel (up to $500,000 in these purchases per calendar year) and 1.5x points on eligible purchases of $5,000 or more (up to $2 million per year). Other purchases earn 1x points.",
        summary:
          "5x Amex Travel flights and prepaid hotels (up to $500k/yr), 1.5x on large purchases, 1x other.",
        tags: ["points", "earning", "5x travel", "1.5x", "business"],
        title: "Earning rates",
        value: "5x Amex Travel",
      },
      {
        category: "everyday",
        details:
          "Up to $200 in annual statement credits for U.S. purchases at Dell Technologies after enrollment, useful for monitors, laptops, and accessories.",
        summary:
          "$200 annual Dell Technologies credit for business technology purchases.",
        tags: [
          "dell",
          "technology",
          "credit",
          "business",
          "hardware",
          "laptop",
          "computer",
          "monitor",
        ],
        title: "Dell Technologies credit",
        value: "$200/year",
      },
      {
        category: "everyday",
        details:
          "Up to $120 in annual credits for Indeed hiring and up to $150 for Adobe Creative Cloud purchases when you enroll and pay with the card.",
        summary:
          "Annual credits toward Indeed hiring and Adobe Creative Cloud.",
        tags: ["indeed", "adobe", "hiring", "software", "credit", "business"],
        title: "Indeed and Adobe credits",
        value: "Up to $270/year",
      },
      {
        category: "travel",
        details:
          "Get 35% of your points back when you use Pay with Points for eligible flights through Amex Travel, plus access to the Global Lounge Collection.",
        summary:
          "35% points rebate on eligible flights booked with points, plus lounge access.",
        tags: ["points", "flights", "amex travel", "lounge", "business"],
        title: "35% points rebate on flights",
      },
    ],
    category: "credit_card",
    description:
      "Business travel card with software, hiring, and travel statement credits.",
    issuer: "American Express",
    name: "American Express Business Platinum Card",
    section: "work",
    slug: "amex-business-platinum",
    website:
      "https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-business-platinum-credit-card-amex/",
  },
  {
    annualFee: 39_900,
    benefits: [
      {
        category: "everyday",
        details:
          "Includes InMail credits to message people outside your network, applicant insights to see how you compare to other candidates, and access to LinkedIn Learning courses.",
        summary:
          "InMail credits, applicant insights, and LinkedIn Learning access.",
        tags: ["career", "inmail", "linkedin learning", "networking", "jobs"],
        title: "Networking and learning tools",
      },
    ],
    category: "membership",
    description:
      "Career-focused membership with networking, insights, and learning tools.",
    issuer: "LinkedIn",
    name: "LinkedIn Premium Career",
    section: "work",
    slug: "linkedin-premium-career",
    website: "https://premium.linkedin.com/",
  },
  {
    benefits: [
      {
        category: "everyday",
        details:
          "One membership gives access to thousands of gyms, studios, and wellness apps. Many employers subsidize the plan, and you can check in at different locations.",
        summary:
          "Access to a network of gyms, studios, and wellness apps, often employer-subsidized.",
        tags: ["gym", "fitness", "wellness", "wellhub", "gympass", "employer"],
        title: "Gym and wellness network access",
      },
    ],
    category: "membership",
    description:
      "Corporate wellness membership giving access to a network of gyms and wellness apps.",
    issuer: "Wellhub",
    name: "Wellhub (Gympass)",
    section: "work",
    slug: "wellhub",
    website: "https://wellhub.com/",
  },
  {
    annualFee: 2990,
    benefits: [
      {
        category: "security",
        details:
          "Stores passwords, passkeys, and payment cards in an encrypted vault, monitors for data breaches, and includes Travel Mode to hide sensitive vaults when crossing borders.",
        summary:
          "Encrypted password vault with breach monitoring and Travel Mode.",
        tags: [
          "password manager",
          "security",
          "breach",
          "passkeys",
          "travel mode",
        ],
        title: "Password manager and breach alerts",
      },
    ],
    category: "membership",
    description:
      "Password manager with breach monitoring and secure vault sharing.",
    issuer: "1Password",
    name: "1Password",
    section: "security",
    slug: "1password",
    website: "https://1password.com/",
  },
  {
    annualFee: 11_900,
    benefits: [
      {
        category: "streaming",
        details:
          "Ad-free listening, offline downloads, and high-quality audio. Premium also includes a monthly audiobook listening allowance, and some plans bundle Hulu.",
        summary:
          "Ad-free music, offline downloads, and audiobook listening hours.",
        tags: ["music", "streaming", "audiobooks", "offline", "ad-free"],
        title: "Ad-free music and audiobooks",
      },
    ],
    category: "membership",
    description: "Ad-free music and podcast streaming with offline downloads.",
    issuer: "Spotify",
    name: "Spotify Premium",
    section: "streaming",
    slug: "spotify-premium",
    website: "https://www.spotify.com/premium/",
  },
  {
    annualFee: 13_990,
    benefits: [
      {
        category: "streaming",
        details:
          "Watch YouTube without ads, play videos in the background or picture-in-picture, download videos for offline viewing, and get YouTube Music Premium included.",
        summary:
          "Ad-free YouTube, background play, downloads, and YouTube Music.",
        tags: ["youtube", "streaming", "ad-free", "youtube music", "downloads"],
        title: "Ad-free YouTube and YouTube Music",
      },
    ],
    category: "membership",
    description:
      "Ad-free YouTube with background play and YouTube Music included.",
    issuer: "YouTube",
    name: "YouTube Premium",
    section: "streaming",
    slug: "youtube-premium",
    website: "https://www.youtube.com/premium",
  },
  {
    annualFee: 9500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 5x points on purchases through Chase Travel; 3x on dining, on gas stations and EV charging, on vacation homes at top brands, and on top streaming services and online grocery (exclusions apply); 2x on all other travel; and 1x on everything else.",
        summary:
          "5x Chase Travel, 3x dining/gas/streaming/online grocery, 2x other travel, 1x other.",
        tags: [
          "points",
          "earning",
          "5x chase travel",
          "3x dining",
          "2x travel",
        ],
        title: "Earning rates",
        value: "5x Chase Travel",
      },
      {
        category: "car_rental",
        details:
          "Primary Auto Rental Coverage when you charge the rental to the card and decline the rental company's collision insurance. Reimburses theft and collision damage up to $60,000 for most vehicles.",
        howToUse:
          "Pay for the rental with the card and decline the rental company's CDW/LDW.",
        summary:
          "Primary rental car coverage up to $60,000 when you pay with the card and decline the rental company's insurance.",
        tags: ["rental car", "insurance", "primary", "collision", "car rental"],
        title: "Primary Auto Rental Coverage",
        value: "Up to $60,000",
      },
      {
        category: "shopping",
        details:
          "Purchase Protection covers eligible new purchases for 120 days against damage or theft, up to $500 per item.",
        summary:
          "New purchases are covered against damage or theft for 120 days (up to $500 per item).",
        tags: ["purchase protection", "phone", "theft", "damage", "shopping"],
        title: "Purchase Protection",
        value: "Up to $500 per item",
      },
      {
        category: "travel",
        details:
          "Trip Cancellation and Interruption Insurance reimburses up to $10,000 per covered traveler and $20,000 per trip for prepaid, non-refundable travel if a trip is canceled or cut short. Also includes trip delay and lost luggage coverage.",
        summary:
          "Trip cancellation and interruption up to $10,000 per traveler, plus delay and lost luggage coverage.",
        tags: [
          "trip cancellation",
          "trip delay",
          "luggage",
          "insurance",
          "travel",
        ],
        title: "Trip protection",
        value: "Up to $10,000 per traveler",
      },
      {
        category: "travel",
        details:
          "Up to $100 in annual statement credits for hotel stays booked through Chase Travel, plus a Global Entry, TSA PreCheck, or NEXUS application fee credit of up to $120 every four years.",
        summary:
          "$100 annual Chase Travel hotel credit and up to $120 for Global Entry/TSA PreCheck.",
        tags: ["hotel credit", "global entry", "tsa precheck", "travel"],
        title: "Travel credits",
        value: "$100/year + $120/4 years",
      },
      {
        category: "dining",
        details:
          "Complimentary DashPass membership for DoorDash and Caviar (a $120 value for 12 months) plus a $10 monthly promo on eligible non-restaurant orders.",
        summary:
          "Complimentary DoorDash DashPass plus $10/month in DoorDash credits.",
        tags: ["doordash", "dashpass", "dining", "delivery", "credit"],
        title: "DoorDash DashPass and credits",
      },
    ],
    category: "credit_card",
    description:
      "Mid-tier travel card with transferable points, primary rental car coverage, and a broad set of travel protections.",
    issuer: "Chase",
    name: "Chase Sapphire Preferred",
    section: "credit_card",
    slug: "chase-sapphire-preferred",
    website:
      "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 4% cash back on eligible gas and EV charging (first $7,000 per year, then 1%), 3% on restaurants and eligible travel, 2% at Costco and Costco.com, and 1% on all other purchases. No annual fee with a paid Costco membership.",
        howToUse:
          "Use the card at Costco and for gas and dining; cash back is paid annually as a reward certificate.",
        summary:
          "4% gas/EV (first $7k/yr), 3% restaurants and travel, 2% Costco, 1% other.",
        tags: [
          "cash back",
          "earning",
          "4% gas",
          "3% restaurants",
          "3% travel",
          "2% costco",
          "rental car",
        ],
        title: "Earning rates",
        value: "Up to 4% back",
      },
    ],
    category: "credit_card",
    description:
      "Costco's no-annual-fee cash back card that doubles as your membership card.",
    issuer: "Citi",
    name: "Costco Anywhere Visa",
    section: "credit_card",
    slug: "costco-anywhere-visa",
    website: "https://www.costco.com/costco-anywhere-visa-card.html",
  },
  {
    annualFee: 32_500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 4x points at restaurants worldwide (up to $50,000 in purchases per calendar year, then 1x) and 4x points at U.S. supermarkets (up to $25,000 per year, then 1x). Earn 3x points on flights booked through American Express Travel and 2x on prepaid car rentals booked through Amex Travel; 1x on everything else.",
        summary:
          "4x dining (up to $50k/yr) and U.S. supermarkets (up to $25k/yr); 3x Amex Travel flights; 1x other.",
        tags: ["points", "earning", "4x dining", "4x groceries", "3x flights"],
        title: "Earning rates",
        value: "4x dining/groceries",
      },
      {
        category: "dining",
        details:
          "Up to $120 in annual dining statement credits at participating partners (such as Grubhub, Cheesecake Factory, and select others) and up to $120 in Uber Cash annually ($10/month).",
        summary: "$120 annual dining credit plus $120 annual Uber Cash.",
        tags: ["dining credit", "uber cash", "grubhub", "credit", "dining"],
        title: "Dining and Uber credits",
        value: "Up to $240/year",
      },
    ],
    category: "credit_card",
    description:
      "Amex's food-focused card with dining and grocery earning plus monthly credits.",
    issuer: "American Express",
    name: "American Express Gold Card",
    section: "credit_card",
    slug: "amex-gold",
    website: "https://www.americanexpress.com/us/credit-cards/card/gold-card/",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 5% cash back on travel purchased through Chase Travel, 3% on dining (including takeout and eligible delivery) and drugstores, and an unlimited 1.5% on all other purchases.",
        summary:
          "5% Chase Travel, 3% dining and drugstores, 1.5% everywhere else.",
        tags: [
          "cash back",
          "earning",
          "5% chase travel",
          "3% dining",
          "1.5% base",
        ],
        title: "Earning rates",
        value: "1.5% base",
      },
      {
        category: "shopping",
        details:
          "Includes purchase protection and extended warranty on eligible items, plus trip cancellation and interruption insurance on eligible travel.",
        summary:
          "Purchase protection, extended warranty, and trip insurance on eligible purchases.",
        tags: ["purchase protection", "warranty", "trip insurance", "shopping"],
        title: "Purchase and travel protections",
      },
    ],
    category: "credit_card",
    description:
      "No-annual-fee cash back card with bonus categories and purchase protections.",
    issuer: "Chase",
    name: "Chase Freedom Unlimited",
    section: "credit_card",
    slug: "chase-freedom-unlimited",
    website:
      "https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn an unlimited 2% cash back on every purchase: 1% when you buy and an additional 1% as you pay the bill. No annual fee and no categories to track.",
        summary:
          "2% cash back on all purchases (1% when you buy, 1% when you pay).",
        tags: ["cash back", "earning", "2%", "flat rate", "everyday"],
        title: "Earning rates",
        value: "2% back",
      },
    ],
    category: "credit_card",
    description: "Simple flat-rate cash back card with no annual fee.",
    issuer: "Citi",
    name: "Citi Double Cash Card",
    section: "credit_card",
    slug: "citi-double-cash",
    website: "https://www.citi.com/credit-cards/citi-double-cash-credit-card",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn up to 4x points at Bilt partner restaurants (20,000+), 3x on hotels booked through Bilt Travel, 2x on flights through Bilt Travel, and 1x on other everyday purchases. Rent and mortgage payments earn up to 1.25x with no transaction fee, with the multiplier based on your everyday card spend.",
        summary:
          "Up to 4x partner dining, 3x Bilt Travel hotels, 2x flights, 1x other, and up to 1.25x on rent (no fee).",
        tags: [
          "points",
          "earning",
          "rent",
          "dining",
          "travel",
          "no annual fee",
        ],
        title: "Earning rates",
        value: "Up to 1.25x rent",
      },
    ],
    category: "credit_card",
    description:
      "Rent-rewards card that earns points on rent with no transaction fees.",
    issuer: "Bilt",
    name: "Bilt Rewards",
    section: "credit_card",
    slug: "bilt-rewards",
    website: "https://www.biltrewards.com/",
  },
  {
    annualFee: 9900,
    benefits: [
      {
        category: "dining",
        details:
          "$0 delivery fee and reduced service fees on eligible Uber Eats orders over the minimum subtotal, plus up to 10% off eligible delivery and pickup orders.",
        summary:
          "$0 delivery fees and up to 10% off eligible Uber Eats orders.",
        tags: [
          "uber eats",
          "delivery",
          "dining",
          "food delivery",
          "delivery fee",
        ],
        title: "$0 delivery fee on Uber Eats",
      },
      {
        category: "travel",
        details:
          "Earn 5% back on eligible rides as Uber One credits, get automatic savings when surge pricing is high, and earn 10% Uber One credits on car rentals booked through Uber.",
        summary:
          "5% back on rides, surge savings, and 10% back on Uber car rentals.",
        tags: ["uber", "rideshare", "car rental", "credits", "travel"],
        title: "Ride credits and rental rewards",
      },
    ],
    category: "membership",
    description:
      "Uber and Uber Eats membership with delivery and ride savings.",
    issuer: "Uber",
    name: "Uber One",
    section: "travel",
    slug: "uber-one",
    website: "https://www.uber.com/us/en/uber-one/",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "shopping",
        details:
          "Access to employee pricing and discounts at 30,000+ national and local merchants across 20+ categories, including electronics, travel, groceries, fitness, and car buying.",
        howToUse:
          "Sign in through your employer's Perks at Work portal and shop via the links to get the discounted price.",
        summary:
          "Employee discounts at 30,000+ merchants across electronics, travel, groceries, and more.",
        tags: ["discounts", "employee", "shopping", "electronics", "travel"],
        title: "Employee discounts",
      },
      {
        category: "everyday",
        details:
          "Earn WOWPoints when you shop through Perks at Work (10x points is like getting 10% back) and access free online classes and coaching through the Community Online Academy.",
        summary:
          "Earn WOWPoints on purchases plus free online classes and coaching.",
        tags: ["wowpoints", "rewards", "classes", "coaching", "wellness"],
        title: "WOWPoints and free classes",
      },
    ],
    category: "membership",
    description:
      "Employer discount program offering deals across thousands of brands.",
    issuer: "Perks at Work",
    name: "Perks at Work",
    section: "work",
    slug: "perks-at-work",
    website: "https://www.perksatwork.com/",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "everyday",
        details:
          "Includes Word, Excel, PowerPoint, and Outlook, plus 1 TB of OneDrive cloud storage per person and AI features in supported apps.",
        summary:
          "Office apps plus 1 TB of OneDrive cloud storage and AI features.",
        tags: ["office", "onedrive", "storage", "productivity", "work"],
        title: "Office apps and 1 TB storage",
      },
    ],
    category: "membership",
    description:
      "Productivity suite with Office apps, cloud storage, and AI features.",
    issuer: "Microsoft",
    name: "Microsoft 365",
    section: "work",
    slug: "microsoft-365",
    website: "https://www.microsoft.com/microsoft-365",
  },
  {
    annualFee: 9800,
    benefits: [
      {
        category: "shopping",
        details:
          "Free shipping with no order minimum on eligible items, free same-day delivery from your store on orders $35+, and free curbside pickup.",
        summary:
          "Free shipping with no minimum, plus free same-day delivery on $35+ orders.",
        tags: ["shipping", "delivery", "grocery", "walmart", "free delivery"],
        title: "Free shipping and delivery",
      },
      {
        category: "everyday",
        details:
          "Save on fuel at Walmart, Murphy, and participating Exxon and Mobil stations, and get Paramount+ Essential included with membership.",
        summary: "Fuel discounts plus Paramount+ Essential included.",
        tags: ["fuel", "gas", "paramount plus", "streaming", "discount"],
        title: "Fuel savings and Paramount+",
      },
    ],
    category: "membership",
    description:
      "Warehouse retailer membership with free shipping, delivery, and fuel savings.",
    issuer: "Walmart",
    name: "Walmart+",
    section: "grocery",
    slug: "walmart-plus",
    website: "https://www.walmart.com/plus",
  },
  {
    annualFee: 9900,
    benefits: [
      {
        category: "shopping",
        details:
          "Free same-day delivery with Shipt on orders of $35 or more, free 2-day shipping on eligible items, and an extra 30 days for returns.",
        summary:
          "Free same-day Shipt delivery on $35+, free 2-day shipping, and extended returns.",
        tags: ["target", "delivery", "shipt", "returns", "grocery"],
        title: "Same-day delivery and extended returns",
      },
    ],
    category: "membership",
    description:
      "Target's paid membership with same-day delivery and extended returns.",
    issuer: "Target",
    name: "Target Circle 360",
    section: "grocery",
    slug: "target-circle-360",
    website: "https://www.target.com/circle/360",
  },
  {
    annualFee: 9600,
    benefits: [
      {
        category: "dining",
        details:
          "$0 delivery fees and reduced service fees on eligible orders over the minimum subtotal from DashPass merchants, including restaurants, grocery, and convenience.",
        summary:
          "$0 delivery fees and reduced service fees on eligible DashPass orders.",
        tags: ["doordash", "delivery", "dining", "grocery", "dashpass"],
        title: "$0 delivery fees",
      },
    ],
    category: "membership",
    description:
      "Delivery membership for restaurants, grocery, and retail orders.",
    issuer: "DoorDash",
    name: "DoorDash DashPass",
    section: "grocery",
    slug: "doordash-dashpass",
    website: "https://www.doordash.com/dashpass/",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "Miles do not expire, and you earn on Delta flights plus partners in the SkyTeam alliance and other airlines. Members get access to award seats and member-only fares.",
        summary:
          "Miles that never expire, partner earning, and member-only fares.",
        tags: ["airline", "miles", "skymiles", "delta", "loyalty"],
        title: "Miles that do not expire",
      },
    ],
    category: "loyalty",
    description:
      "Delta's loyalty program with miles that do not expire and partner earning.",
    issuer: "Delta",
    name: "Delta SkyMiles",
    section: "travel",
    slug: "delta-skymiles",
    website: "https://www.delta.com/us/en/skymiles/overview",
  },
  {
    benefits: [
      {
        category: "lounge",
        details:
          "Access to 1,300+ airport lounges worldwide, plus participating airport restaurants and spas depending on your plan. Many premium credit cards include a Priority Pass membership as a benefit.",
        howToUse:
          "Show your digital Priority Pass card and boarding pass at participating lounges.",
        summary:
          "Access to 1,300+ airport lounges worldwide, often included with premium cards.",
        tags: ["lounge", "airport", "priority pass", "travel"],
        title: "Airport lounge access",
      },
    ],
    category: "membership",
    description:
      "Lounge access membership covering 1,300+ airport lounges worldwide.",
    issuer: "Priority Pass",
    name: "Priority Pass",
    section: "travel",
    slug: "priority-pass",
    website: "https://www.prioritypass.com/",
  },
  {
    annualFee: 23_900,
    benefits: [
      {
        category: "streaming",
        details:
          "Bundles Apple Music, Apple TV+, and Apple Arcade (plus Apple Fitness+ and more storage on Premier), and includes iCloud+ storage. One bill instead of several.",
        summary:
          "Bundles Apple Music, TV+, Arcade, and iCloud+ storage in one subscription.",
        tags: ["apple music", "apple tv", "icloud", "streaming", "bundle"],
        title: "Apple services bundle",
      },
    ],
    category: "membership",
    description:
      "Apple subscription bundle combining music, TV, games, and cloud storage.",
    issuer: "Apple",
    name: "Apple One",
    section: "streaming",
    slug: "apple-one",
    website: "https://www.apple.com/apple-one/",
  },
  {
    annualFee: 4900,
    benefits: [
      {
        category: "security",
        details:
          "Encrypted VPN across multiple devices, threat protection that blocks malware and trackers, and a password manager add-on option. Useful on public Wi-Fi while traveling.",
        summary:
          "Encrypted VPN with threat protection and multi-device support, handy on public Wi-Fi.",
        tags: ["vpn", "security", "privacy", "travel", "public wifi"],
        title: "VPN and online protection",
      },
    ],
    category: "membership",
    description:
      "VPN and online protection with threat and identity safeguards.",
    issuer: "Nord Security",
    name: "NordVPN",
    section: "security",
    slug: "nordvpn",
    website: "https://nordvpn.com/",
  },
  {
    annualFee: 5000,
    benefits: [
      {
        category: "shopping",
        details:
          "Shop Sam's Club warehouses and samsclub.com with member pricing on groceries, electronics, and household goods. Membership includes a free card for one household member.",
        summary:
          "Warehouse and online access with member pricing plus a free household card.",
        tags: ["warehouse", "grocery", "member pricing", "household card"],
        title: "Warehouse access and member pricing",
      },
      {
        category: "everyday",
        details:
          "Member pricing on fuel at Sam's Club gas stations, tires and batteries, the pharmacy, and the optical center. Members also get travel and entertainment discounts.",
        summary:
          "Fuel, tire, pharmacy, and optical savings plus travel and entertainment discounts.",
        tags: ["fuel", "gas", "tires", "pharmacy", "optical", "travel"],
        title: "Fuel, tire, and pharmacy savings",
      },
    ],
    category: "membership",
    description:
      "Base warehouse membership with member pricing, fuel savings, and travel discounts. The Plus tier adds 2% Sam's Cash and free shipping.",
    issuer: "Sam's Club",
    name: "Sam's Club Membership",
    section: "grocery",
    slug: "sams-club",
    website: "https://www.samsclub.com/join",
  },
  {
    annualFee: 12_000,
    benefits: [
      {
        category: "dining",
        details:
          "$0 delivery fees on eligible orders over the minimum from Grubhub+ merchants, plus member-only promos and reduced service fees. Often included free with Amazon Prime or other memberships.",
        summary:
          "$0 delivery fees and member promos on eligible Grubhub orders.",
        tags: [
          "grubhub",
          "delivery",
          "dining",
          "food delivery",
          "delivery fee",
        ],
        title: "$0 delivery fees on eligible orders",
      },
    ],
    category: "membership",
    description:
      "Food delivery membership with $0 delivery fees and member promos; often bundled free with other programs.",
    issuer: "Grubhub",
    name: "Grubhub+",
    section: "grocery",
    slug: "grubhub-plus",
    website: "https://www.grubhub.com/grubhub-plus",
  },
  {
    annualFee: 7800,
    benefits: [
      {
        category: "security",
        details:
          "Membership for about five years that lets you use dedicated TSA PreCheck lanes at 200+ airports. You generally keep your shoes, belt, and light jacket on and can leave laptops and liquids in your bag. Often reimbursed by a credit card.",
        summary:
          "Faster airport security for about five years, usually with shoes and laptops left in place.",
        tags: [
          "tsa precheck",
          "airport",
          "security",
          "travel",
          "skip the line",
        ],
        title: "Expedited airport security",
        value: "~5 years",
      },
    ],
    category: "membership",
    description:
      "Trusted traveler program for faster airport security screening.",
    issuer: "TSA",
    name: "TSA PreCheck",
    section: "travel",
    slug: "tsa-precheck",
    website: "https://www.tsa.gov/precheck",
  },
  {
    annualFee: 12_000,
    benefits: [
      {
        category: "travel",
        details:
          "Five-year membership for expedited U.S. customs and immigration when returning from abroad, using Global Entry kiosks or the mobile app. It includes TSA PreCheck benefits, and many credit cards reimburse the application fee.",
        summary:
          "Expedited U.S. customs on return trips for five years, and it includes TSA PreCheck.",
        tags: [
          "global entry",
          "customs",
          "immigration",
          "tsa precheck",
          "airport",
          "travel",
        ],
        title: "Expedited customs and immigration",
        value: "5 years",
      },
    ],
    category: "membership",
    description:
      "U.S. trusted traveler program for expedited customs and immigration.",
    issuer: "U.S. Customs and Border Protection",
    name: "Global Entry",
    section: "travel",
    slug: "global-entry",
    website:
      "https://www.cbp.gov/travel/trusted-traveler-programs/global-entry",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "Hilton Honors Gold status includes daily breakfast or a food and beverage credit at many brands, space-available room upgrades, and a bonus on points earned. It also gets the fifth night free on reward stays.",
        summary:
          "Breakfast or F&B credit, room upgrades, bonus points, and fifth-night-free awards.",
        tags: [
          "hotel",
          "hilton",
          "status",
          "breakfast",
          "upgrade",
          "fifth night free",
        ],
        title: "Hilton Honors Gold perks",
      },
    ],
    category: "loyalty",
    description:
      "Mid-tier Hilton Honors status, often granted by a credit card.",
    issuer: "Hilton",
    name: "Hilton Honors Gold",
    section: "travel",
    slug: "hilton-honors-gold",
    website: "https://www.hilton.com/en/hilton-honors/",
  },
  {
    benefits: [
      {
        category: "lounge",
        details:
          "Hilton Honors Diamond adds lounge access at hotels that have one, stronger upgrade priority, a larger points bonus, and the fifth night free on reward stays.",
        summary:
          "Lounge access where available, better upgrades, larger points bonus, and fifth-night-free awards.",
        tags: ["hotel", "hilton", "status", "lounge", "upgrade"],
        title: "Hilton Honors Diamond perks",
      },
    ],
    category: "loyalty",
    description:
      "Top-tier Hilton Honors status with lounge access and stronger upgrades.",
    issuer: "Hilton",
    name: "Hilton Honors Diamond",
    section: "travel",
    slug: "hilton-honors-diamond",
    website: "https://www.hilton.com/en/hilton-honors/",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "Marriott Bonvoy Gold Elite includes priority late checkout when available, space-available room upgrades, a welcome gift of points, and bonus points on stays.",
        summary: "Late checkout, room upgrades, and bonus points on stays.",
        tags: ["hotel", "marriott", "status", "late checkout", "upgrade"],
        title: "Marriott Bonvoy Gold perks",
      },
    ],
    category: "loyalty",
    description:
      "Mid-tier Marriott Bonvoy status, often granted by a credit card.",
    issuer: "Marriott",
    name: "Marriott Bonvoy Gold Elite",
    section: "travel",
    slug: "marriott-bonvoy-gold",
    website: "https://www.marriott.com/loyalty.mi",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "Marriott Bonvoy Platinum Elite includes breakfast or a lounge option at many brands, guaranteed 4pm late checkout, stronger upgrades including suites when available, and a bigger points bonus.",
        summary:
          "Breakfast or lounge access, 4pm checkout, stronger upgrades, and bonus points.",
        tags: [
          "hotel",
          "marriott",
          "status",
          "breakfast",
          "lounge",
          "late checkout",
        ],
        title: "Marriott Bonvoy Platinum perks",
      },
    ],
    category: "loyalty",
    description:
      "Upper-tier Marriott Bonvoy status with breakfast/lounge and 4pm checkout.",
    issuer: "Marriott",
    name: "Marriott Bonvoy Platinum Elite",
    section: "travel",
    slug: "marriott-bonvoy-platinum",
    website: "https://www.marriott.com/loyalty.mi",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "World of Hyatt Discoverist includes preferred rooms, late checkout when available, complimentary bottled water, and bonus points on eligible stays.",
        summary:
          "Preferred rooms, late checkout, bottled water, and bonus points.",
        tags: ["hotel", "hyatt", "status", "late checkout", "points"],
        title: "World of Hyatt Discoverist perks",
      },
    ],
    category: "loyalty",
    description:
      "Entry-level World of Hyatt status, often granted by a credit card.",
    issuer: "Hyatt",
    name: "World of Hyatt Discoverist",
    section: "travel",
    slug: "hyatt-discoverist",
    website: "https://www.hyatt.com/world-of-hyatt",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "World of Hyatt Globalist is the top tier: suite upgrades when available, free breakfast or lounge access, waived resort fees on award stays, free parking on award stays, and the best points bonus.",
        summary:
          "Suite upgrades, breakfast or lounge access, waived resort fees, and free parking on awards.",
        tags: [
          "hotel",
          "hyatt",
          "status",
          "suite upgrade",
          "breakfast",
          "lounge",
        ],
        title: "World of Hyatt Globalist perks",
      },
    ],
    category: "loyalty",
    description:
      "Top-tier World of Hyatt status with the strongest upgrades and fee waivers.",
    issuer: "Hyatt",
    name: "World of Hyatt Globalist",
    section: "travel",
    slug: "hyatt-globalist",
    website: "https://www.hyatt.com/world-of-hyatt",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "IHG One Rewards Platinum Elite includes room upgrades when available, bonus points on stays, and priority late checkout.",
        summary: "Room upgrades, bonus points, and late checkout.",
        tags: ["hotel", "ihg", "status", "upgrade", "late checkout"],
        title: "IHG Platinum Elite perks",
      },
    ],
    category: "loyalty",
    description:
      "Mid-tier IHG One Rewards status, often granted by a credit card.",
    issuer: "IHG",
    name: "IHG One Rewards Platinum Elite",
    section: "travel",
    slug: "ihg-platinum",
    website: "https://www.ihg.com/onerewards",
  },
  {
    benefits: [
      {
        category: "travel",
        details:
          "IHG One Rewards Diamond Elite adds a breakfast or points option at many brands, stronger upgrade priority, and the highest points bonus.",
        summary:
          "Breakfast or points option, stronger upgrades, and top points bonus.",
        tags: ["hotel", "ihg", "status", "breakfast", "upgrade"],
        title: "IHG Diamond Elite perks",
      },
    ],
    category: "loyalty",
    description:
      "Top-tier IHG One Rewards status with breakfast option and stronger upgrades.",
    issuer: "IHG",
    name: "IHG One Rewards Diamond Elite",
    section: "travel",
    slug: "ihg-diamond",
    website: "https://www.ihg.com/onerewards",
  },
  {
    benefits: [
      {
        category: "car_rental",
        details:
          "Hertz Gold Plus Rewards Five Star and President's Circle give faster pick-up, a wider choice of vehicles, and space-available upgrades, with the best selection at President's Circle. Status is often included with premium credit cards or earned through rentals.",
        summary:
          "Faster pick-up, a wider vehicle choice, and upgrades; often included with premium cards.",
        tags: [
          "rental car",
          "hertz",
          "elite status",
          "upgrade",
          "skip the line",
        ],
        title: "Hertz elite status",
      },
    ],
    category: "loyalty",
    description:
      "Hertz rental car loyalty status for faster pick-up and upgrades.",
    issuer: "Hertz",
    name: "Hertz Gold Plus Rewards",
    section: "travel",
    slug: "hertz-gold-plus-rewards",
    website: "https://www.hertz.com/rentacar/rewards.do",
  },
  {
    benefits: [
      {
        category: "car_rental",
        details:
          "National Emerald Club Executive lets you choose any car from the Emerald Aisle and pay the midsize rate, with faster pick-up and no counter stop. Often included with premium credit cards.",
        summary:
          "Choose your own car from the Emerald Aisle and skip the counter; often included with premium cards.",
        tags: [
          "rental car",
          "national",
          "elite status",
          "emerald aisle",
          "upgrade",
        ],
        title: "National Emerald Club Executive",
      },
    ],
    category: "loyalty",
    description:
      "National rental car loyalty status with pick-your-own-vehicle access.",
    issuer: "National",
    name: "National Emerald Club Executive",
    section: "travel",
    slug: "national-emerald-club-executive",
    website: "https://www.nationalcar.com/en/emerald-club.html",
  },
  {
    benefits: [
      {
        category: "car_rental",
        details:
          "Avis Preferred Plus and President's Club offer expedited pick-up, space-available upgrades, and bonus points on rentals. Status is often included with premium credit cards.",
        summary:
          "Expedited pick-up, upgrades, and bonus points; often included with premium cards.",
        tags: [
          "rental car",
          "avis",
          "elite status",
          "upgrade",
          "skip the line",
        ],
        title: "Avis Preferred status",
      },
    ],
    category: "loyalty",
    description:
      "Avis rental car loyalty status with expedited pick-up and upgrades.",
    issuer: "Avis",
    name: "Avis Preferred Plus",
    section: "travel",
    slug: "avis-preferred-plus",
    website: "https://www.avis.com/en/avis-preferred",
  },
  {
    annualFee: 8000,
    benefits: [
      {
        category: "travel",
        details:
          "Annual pass covering entrance fees at more than 2,000 federal recreation sites, including national parks, national forests, and wildlife refuges. It covers the pass holder and passengers in a single vehicle.",
        summary:
          "Entrance to 2,000+ national parks and federal recreation sites for a year.",
        tags: ["national parks", "entrance fee", "outdoors", "travel", "parks"],
        title: "National parks annual pass",
        value: "$80/year",
      },
    ],
    category: "membership",
    description:
      "Annual pass for entrance to U.S. national parks and federal recreation sites.",
    issuer: "National Park Service",
    name: "America the Beautiful Pass",
    section: "travel",
    slug: "america-the-beautiful-pass",
    website: "https://www.nps.gov/planyourvisit/passes.htm",
  },
  {
    annualFee: 52_500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn up to 11x total miles on eligible United flights (6x as a United Club member plus 5x from the card), 5x miles on other eligible United purchases, 5x on prepaid hotels through Renowned Hotels & Resorts, 2x on other travel and dining (including delivery), and 1x on everything else.",
        summary:
          "Up to 11x on United flights, 5x United purchases/hotels, 2x travel and dining, 1x other.",
        tags: ["miles", "earning", "united", "11x flights", "2x dining"],
        title: "Earning rates",
        value: "Up to 11x United",
      },
      {
        category: "lounge",
        details:
          "Includes a United Club membership for access to United Club lounges and participating partner lounges when flying United, plus two free checked bags and Premier Access priority check-in and boarding.",
        summary:
          "United Club lounge access, two free checked bags, and Premier Access.",
        tags: ["united", "lounge", "checked bags", "premier access", "airline"],
        title: "United Club access and bags",
        value: "2 free checked bags",
      },
    ],
    category: "credit_card",
    description:
      "United Airlines premium card with United Club lounge membership.",
    issuer: "Chase",
    name: "United Club Card",
    section: "credit_card",
    slug: "united-club-card",
    website: "https://creditcards.chase.com/travel-credit-cards/united/club",
  },
  {
    annualFee: 65_000,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 3x miles on Delta purchases made directly with Delta and 1x miles on all other eligible purchases. Also get 20% back on eligible in-flight purchases and 10% back on qualifying concessions purchases (up to $250 per calendar year).",
        summary:
          "3x miles on Delta purchases, 1x on everything else, plus 20% back in-flight.",
        tags: ["miles", "earning", "delta", "3x delta", "inflight"],
        title: "Earning rates",
        value: "3x Delta",
      },
      {
        category: "lounge",
        details:
          "Includes Delta Sky Club access (subject to visit limits for some cardholders) and Centurion Lounge access when flying Delta, plus a companion certificate each year after renewal and status boosts toward Medallion status.",
        summary:
          "Sky Club access, an annual companion certificate, and status boosts.",
        tags: ["delta", "lounge", "companion certificate", "status", "airline"],
        title: "Sky Club access and companion certificate",
      },
    ],
    category: "credit_card",
    description:
      "Delta premium card with Sky Club access and an annual companion certificate.",
    issuer: "American Express",
    name: "Delta SkyMiles Reserve",
    section: "credit_card",
    slug: "delta-skymiles-reserve",
    website:
      "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-reserve-american-express-card/",
  },
  {
    annualFee: 59_500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 4x miles on eligible American Airlines purchases (5x total after $150,000 in calendar-year spend), 12x miles on eligible AAdvantage Hotels and AAdvantage Cars bookings, and 1x miles on all other purchases.",
        summary:
          "4x American Airlines (5x after $150k/yr), 12x AAdvantage Hotels/Cars, 1x other.",
        tags: ["miles", "earning", "american airlines", "4x", "12x hotels"],
        title: "Earning rates",
        value: "4x American Airlines",
      },
      {
        category: "lounge",
        details:
          "Includes an Admirals Club membership for access to American Airlines Admirals Club lounges, plus a free checked bag and priority boarding on eligible American Airlines flights.",
        summary:
          "Admirals Club membership, a free checked bag, and priority boarding.",
        tags: [
          "american airlines",
          "admirals club",
          "lounge",
          "checked bag",
          "priority boarding",
        ],
        title: "Admirals Club access and bags",
      },
    ],
    category: "credit_card",
    description:
      "American Airlines premium card with Admirals Club membership.",
    issuer: "Citi",
    name: "Citi / AAdvantage Executive World Elite",
    section: "credit_card",
    slug: "aa-executive-card",
    website:
      "https://www.citi.com/credit-cards/aadvantage-executive-world-elite-mastercard",
  },
  {
    annualFee: 9500,
    benefits: [
      {
        category: "rewards",
        details:
          "Earn 3x miles on Alaska Airlines and Hawaiian Airlines purchases and 2x miles on eligible gas, EV charging, cable, streaming, and local transit (including rideshare), with 1x on all other purchases. Also get 20% back on eligible in-flight purchases.",
        summary:
          "3x Alaska/Hawaiian, 2x gas/EV/streaming/transit, 1x other, plus 20% back in-flight.",
        tags: ["miles", "earning", "alaska airlines", "3x", "2x gas"],
        title: "Earning rates",
        value: "3x Alaska",
      },
      {
        category: "travel",
        details:
          "Includes an annual companion fare from $99 (plus taxes and fees), a free checked bag for you and up to six guests on the same reservation, and priority boarding.",
        summary:
          "Annual companion fare from $99, a free checked bag, and priority boarding.",
        tags: [
          "alaska airlines",
          "companion fare",
          "checked bag",
          "priority boarding",
          "airline",
        ],
        title: "Companion fare and free checked bag",
      },
    ],
    category: "credit_card",
    description:
      "Alaska Airlines card with an annual companion fare and free checked bag.",
    issuer: "Bank of America",
    name: "Alaska Airlines Visa Signature",
    section: "credit_card",
    slug: "alaska-airlines-card",
    website: "https://www.alaskaair.com/content/credit-card",
  },
  {
    benefits: [
      {
        category: "streaming",
        details:
          "Higher-tier T-Mobile plans bundle streaming services (such as Netflix, Apple TV+, or Hulu depending on the plan), include international data and texting, and offer in-flight Wi-Fi on eligible flights.",
        summary:
          "Bundled streaming, international data, and in-flight Wi-Fi depending on the plan.",
        tags: [
          "t-mobile",
          "cellular",
          "streaming",
          "netflix",
          "international data",
          "wifi",
        ],
        title: "Streaming and international perks",
      },
    ],
    category: "membership",
    description:
      "Premium cell plan bundles with streaming and international perks.",
    issuer: "T-Mobile",
    name: "T-Mobile Premium Plan",
    section: "phone",
    slug: "t-mobile-premium",
    website: "https://www.t-mobile.com/cell-phone-plans",
  },
  {
    benefits: [
      {
        category: "streaming",
        details:
          "Verizon's higher-tier plans offer discounted or included bundles (such as Disney+, Hulu, Netflix, or Apple One), plus hotspot data and international perks depending on the plan.",
        summary:
          "Discounted streaming bundles plus hotspot and international perks depending on the plan.",
        tags: [
          "verizon",
          "cellular",
          "streaming",
          "disney plus",
          "netflix",
          "hotspot",
        ],
        title: "Streaming bundles and hotspot data",
      },
    ],
    category: "membership",
    description: "Premium cell plan bundles with streaming and hotspot perks.",
    issuer: "Verizon",
    name: "Verizon Premium Plan",
    section: "phone",
    slug: "verizon-premium",
    website: "https://www.verizon.com/plans/",
  },
  {
    benefits: [
      {
        category: "streaming",
        details:
          "AT&T's higher-tier plans include hotspot data, international roaming perks, and device offers, with some plans bundling streaming services such as Max.",
        summary:
          "Hotspot data, international perks, and device/streaming offers depending on the plan.",
        tags: ["att", "cellular", "streaming", "hotspot", "international"],
        title: "Hotspot and international perks",
      },
    ],
    category: "membership",
    description:
      "Premium cell plan bundles with hotspot and international perks.",
    issuer: "AT&T",
    name: "AT&T Premium Plan",
    section: "phone",
    slug: "att-premium",
    website: "https://www.att.com/plans/unlimited-data-plans/",
  },
  {
    benefits: [
      {
        category: "everyday",
        details:
          "Lyra provides evidence-based mental health care through an employer or health plan: therapy, coaching, psychiatry, and medication management, with appointments typically available in days rather than weeks. It also offers self-guided digital programs.",
        summary:
          "Therapy, coaching, psychiatry, and medication management with fast appointments, via your employer or health plan.",
        tags: [
          "mental health",
          "therapy",
          "coaching",
          "psychiatry",
          "eap",
          "employer",
        ],
        title: "Therapy, coaching, and psychiatry",
      },
      {
        category: "everyday",
        details:
          "Lyra is designed for the whole family, including children and teens (with thousands of children's mental health specialists) and couples. Access and cost depend on what your employer or plan has arranged.",
        summary:
          "Whole-family mental health support, including children, teens, and couples.",
        tags: ["family", "children", "teens", "couples", "counseling"],
        title: "Family and couples support",
      },
    ],
    category: "membership",
    description:
      "Employer- or health-plan-provided mental health benefit (therapy, coaching, psychiatry).",
    issuer: "Lyra Health",
    name: "Lyra Health",
    section: "work",
    slug: "lyra-health",
    website: "https://www.lyrahealth.com/",
  },
  {
    benefits: [
      {
        category: "everyday",
        details:
          "Spring Health offers personalized mental health care through employers or insurance: therapy, coaching, medication management, and self-guided tools. A digital assessment matches you to a care plan, and sessions can be as low as $0 depending on your coverage.",
        summary:
          "Therapy, coaching, and medication support matched by assessment, sometimes as low as $0 per session.",
        tags: [
          "mental health",
          "therapy",
          "coaching",
          "medication",
          "eap",
          "employer",
        ],
        title: "Personalized therapy and coaching",
      },
      {
        category: "everyday",
        details:
          "Also includes crisis support, specialty programs, and family care, with in-network clinicians you can filter by specialty, language, and availability. Access depends on your employer or health plan.",
        summary:
          "Crisis support and specialty/family care, depending on your employer or plan.",
        tags: [
          "crisis support",
          "specialty care",
          "family",
          "employer",
          "insurance",
        ],
        title: "Crisis and specialty support",
      },
    ],
    category: "membership",
    description:
      "Employer- or insurance-provided mental health platform (therapy, coaching, medication).",
    issuer: "Spring Health",
    name: "Spring Health",
    section: "work",
    slug: "spring-health",
    website: "https://www.springhealth.com/",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "everyday",
        details:
          "One Care.com membership covers child care, senior care, pet care, and housekeeping. You can search local caregivers, view profiles and reviews, and message them in-app. Some employers provide Care.com as a backup-care benefit.",
        summary:
          "One membership to find child, senior, pet, and home caregivers in your area.",
        tags: [
          "child care",
          "senior care",
          "pet care",
          "housekeeping",
          "caregivers",
          "employer",
        ],
        title: "Child, senior, and pet care",
      },
      {
        category: "everyday",
        details:
          "Premium features include background check requests, detailed caregiver profiles, and the ability to post a job and receive applicants. Employer-sponsored backup care may be free or subsidized.",
        summary:
          "Background checks, caregiver profiles, and job posting; sometimes employer-subsidized.",
        tags: ["background check", "backup care", "employer", "family"],
        title: "Screening and backup care",
      },
    ],
    category: "membership",
    description:
      "Care marketplace for child, senior, pet, and home care; often offered as an employer benefit.",
    issuer: "Care.com",
    name: "Care.com",
    section: "work",
    slug: "care-com",
    website: "https://www.care.com/",
  },
  {
    annualFee: 1600,
    benefits: [
      {
        category: "travel",
        details:
          "AARP membership includes discounts on hotels, car rentals, restaurants, and entertainment, plus access to travel resources and insurance offers. Many discounts are available regardless of age.",
        summary:
          "Discounts on hotels, rental cars, dining, and entertainment, plus insurance offers.",
        tags: ["aarp", "discount", "hotel", "rental car", "dining", "travel"],
        title: "Member discounts",
      },
    ],
    category: "membership",
    description:
      "Member discount program for travel, dining, and insurance offers.",
    issuer: "AARP",
    name: "AARP Membership",
    section: "everyday",
    slug: "aarp",
    website: "https://www.aarp.org/membership/",
  },
  {
    annualFee: 3000,
    benefits: [
      {
        category: "shopping",
        details:
          "REI Co-op membership is a one-time fee that pays an annual member dividend (typically 10% back on eligible full-price purchases), plus access to gear rentals, used gear, shop-service discounts, and member events.",
        summary:
          "One-time membership with an annual dividend, gear rentals, and shop-service discounts.",
        tags: ["rei", "outdoors", "dividend", "gear rental", "used gear"],
        title: "Member dividend and gear rentals",
        value: "One-time $30",
      },
    ],
    category: "membership",
    description:
      "Lifetime outdoor co-op membership with an annual dividend and gear services.",
    issuer: "REI",
    name: "REI Co-op Membership",
    section: "everyday",
    slug: "rei-coop",
    website: "https://www.rei.com/membership",
  },
  {
    annualFee: 0,
    benefits: [
      {
        category: "everyday",
        details:
          "A free library card often includes free digital access to newspapers like the New York Times, ebooks and audiobooks via Libby, streaming services like Kanopy, research databases, and discounted or free museum passes.",
        summary:
          "Free NYT access, ebooks/audiobooks, streaming, databases, and museum passes.",
        tags: [
          "library",
          "nytimes",
          "ebooks",
          "libby",
          "kanopy",
          "museum passes",
        ],
        title: "Digital access and museum passes",
      },
    ],
    category: "membership",
    description:
      "Free local library card with digital media, databases, and museum passes.",
    issuer: "Local library",
    name: "Public Library Card",
    section: "everyday",
    slug: "public-library-card",
  },
  {
    benefits: [
      {
        category: "everyday",
        details:
          "A museum membership usually includes free admission for a year, reciprocal admission to other participating museums, previews of new exhibits, member events, and discounts at the shop, cafe, and parking. Benefits vary by museum and tier.",
        summary:
          "Free year of admission plus reciprocal museum access, previews, events, and shop discounts.",
        tags: ["museum", "reciprocal", "admission", "events", "culture"],
        title: "Admission and reciprocal access",
      },
    ],
    category: "membership",
    description:
      "Local museum membership with reciprocal admission and member events.",
    issuer: "Museum",
    name: "Local Museum Membership",
    section: "everyday",
    slug: "museum-membership",
  },
  {
    benefits: [
      {
        category: "everyday",
        details:
          "A zoo or aquarium membership typically includes a year of free admission, free or discounted parking, guest passes, and discounts on events and food. Many offer reciprocal admission at other zoos and aquariums.",
        summary:
          "A year of free admission plus parking, guest passes, and reciprocal zoo access.",
        tags: [
          "zoo",
          "aquarium",
          "admission",
          "parking",
          "guest passes",
          "family",
        ],
        title: "Admission and reciprocal access",
      },
    ],
    category: "membership",
    description:
      "Zoo or aquarium membership with admission, parking, and guest passes.",
    issuer: "Zoo",
    name: "Zoo Membership",
    section: "everyday",
    slug: "zoo-membership",
  },
];

/**
 * Parent -> child programs. When a user selects the parent, the picker offers
 * to also select these included/bundled programs.
 */
const relations: { child: string; note?: string; parent: string }[] = [
  {
    child: "hilton-honors-gold",
    note: "Complimentary Hilton Honors Gold status (enroll through Amex)",
    parent: "amex-platinum",
  },
  {
    child: "marriott-bonvoy-gold",
    note: "Complimentary Marriott Bonvoy Gold Elite status (enroll through Amex)",
    parent: "amex-platinum",
  },
  {
    child: "hertz-gold-plus-rewards",
    note: "Complimentary Hertz Gold Plus Rewards status",
    parent: "amex-platinum",
  },
  {
    child: "national-emerald-club-executive",
    note: "Complimentary National Emerald Club Executive status",
    parent: "amex-platinum",
  },
  {
    child: "avis-preferred-plus",
    note: "Complimentary Avis Preferred Plus status",
    parent: "amex-platinum",
  },
  {
    child: "clear-plus",
    note: "Up to $199 annual statement credit for CLEAR Plus",
    parent: "amex-platinum",
  },
  {
    child: "walmart-plus",
    note: "Walmart+ membership statement credit",
    parent: "amex-platinum",
  },
  {
    child: "hilton-honors-gold",
    note: "Complimentary Hilton Honors Gold status",
    parent: "amex-business-platinum",
  },
  {
    child: "marriott-bonvoy-gold",
    note: "Complimentary Marriott Bonvoy Gold Elite status",
    parent: "amex-business-platinum",
  },
  {
    child: "hertz-gold-plus-rewards",
    note: "Complimentary Hertz Gold Plus Rewards status",
    parent: "amex-business-platinum",
  },
  {
    child: "national-emerald-club-executive",
    note: "Complimentary National Emerald Club Executive status",
    parent: "amex-business-platinum",
  },
  {
    child: "priority-pass",
    note: "Priority Pass Select membership included",
    parent: "chase-sapphire-reserve",
  },
  {
    child: "doordash-dashpass",
    note: "Complimentary DashPass membership",
    parent: "chase-sapphire-reserve",
  },
  {
    child: "doordash-dashpass",
    note: "Complimentary DashPass membership",
    parent: "chase-sapphire-preferred",
  },
  {
    child: "priority-pass",
    note: "Priority Pass lounge access included",
    parent: "capital-one-venture-x",
  },
  {
    child: "hertz-gold-plus-rewards",
    note: "Complimentary Hertz President's Circle status",
    parent: "capital-one-venture-x",
  },
  {
    child: "grubhub-plus",
    note: "Grubhub+ included free with Prime",
    parent: "amazon-prime",
  },
];

async function seed() {
  console.log("Seeding providers and benefits...");

  for (const seedProvider of providers) {
    const { benefits, ...providerValues } = seedProvider;
    const providerRow = {
      ...providerValues,
      lastVerifiedAt: new Date(),
      sourceType: "seed" as const,
      status: "verified" as const,
    };

    await db
      .insert(provider)
      .values(providerRow)
      .onConflictDoUpdate({ set: providerRow, target: provider.slug });

    const [row] = await db
      .select()
      .from(provider)
      .where(eq(provider.slug, seedProvider.slug))
      .limit(1);

    if (!row) {
      throw new Error(`Failed to seed provider ${seedProvider.slug}`);
    }

    await db.delete(benefit).where(eq(benefit.providerId, row.id));

    await db.insert(benefit).values(
      benefits.map((seedBenefit) => ({
        ...seedBenefit,
        lastVerifiedAt: new Date(),
        providerId: row.id,
        sourceType: "seed" as const,
        status: "verified" as const,
        verifiedBy: "seed",
      }))
    );

    console.log(`  ${seedProvider.name}: ${benefits.length} benefits`);
  }

  const seedSlugs = new Set(providers.map((entry) => entry.slug));
  const existingProviders = await db.select().from(provider);
  for (const existing of existingProviders) {
    if (seedSlugs.has(existing.slug)) {
      continue;
    }
    await db
      .delete(userSubscription)
      .where(eq(userSubscription.providerId, existing.id));
    await db.delete(benefit).where(eq(benefit.providerId, existing.id));
    await db.delete(provider).where(eq(provider.id, existing.id));
    console.log(`  - removed stale provider ${existing.slug}`);
  }

  await db.delete(providerRelation);
  const slugToId = new Map<string, string>();
  for (const existing of await db.select().from(provider)) {
    slugToId.set(existing.slug, existing.id);
  }
  for (const relation of relations) {
    const parentId = slugToId.get(relation.parent);
    const childId = slugToId.get(relation.child);
    if (!(parentId && childId)) {
      console.warn(
        `  ! relation skipped: ${relation.parent} -> ${relation.child}`
      );
      continue;
    }
    await db
      .insert(providerRelation)
      .values({ childId, note: relation.note, parentId });
  }
  console.log(`  relations: ${relations.length}`);

  await db
    .insert(user)
    .values({ email: "anonymous@local", id: ANONYMOUS_USER_ID })
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed");
  console.error(error);
  process.exit(1);
});
