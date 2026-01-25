# 🏎️ Showroom Blitz

**Master the art of car sales in the ultimate dealership simulator!**

Showroom Blitz is a fast-paced, high-stakes car sales simulator where you step
into the shoes of a hungry salesperson. Greet customers, navigate their needs,
negotiate the best possible deals, and stay sharp—your coworkers are just as
eager to close the sale as you are!

![Showroom Blitz Gameplay](https://showroom-blitz.vercel.app/og-image.png)

## 🌟 Key Features

- **Dynamic Showroom Floor**: Watch customers walk in and engage them before
  they get "stolen" by your coworkers.
- **Deep Negotiation Mechanics**: Discuss selling price, monthly payments, APR,
  and down payments. Every customer has a different "heat" level and buyer
  profile.
- **AI-Powered Conversations**: Optionally integrate with Anthropic (Claude) or
  local LLMs (via LM Studio) for realistic, unpredictable customer interactions.
- **Progressive Gameplay**: Track your gross profit and sales count. Strive to
  be the top seller in the dealership.
- **Responsive Design**: Works beautifully on both desktop and mobile devices.
  Install it as a PWA for the full experience.
- **Game Modes**: Choose between _Standard_ mode or the high-pressure _Volume_
  mode.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/showroom-blitz.git
   cd showroom-blitz
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🎮 How to Play

1. **Greet Customers**: Click on customers walking into the showroom. Move close
   to them and hit the **TALK** button to start a conversation.
2. **Qualify the Buyer**: Determine if they are a cash buyer or need financing.
   Listen to their needs and preferences.
3. **Select a Vehicle**: Browse your inventory to find the right car for their
   budget and style.
4. **Close the Deal**: Use the **Numbers Panel** to present an offer. Be
   careful—if your offer is too high, their interest will drop. If it's too low,
   you lose profit!
5. **Watch the Competition**: Don't leave customers unattended for too long, or
   your coworkers will swoop in and steal the deal.

## 🧠 AI Configuration

Showroom Blitz supports advanced AI for customer interactions. To enable this:

1. Go to **Settings** (gear icon).
2. Toggle **Use AI Responses**.
3. Choose your provider:
   - **Anthropic**: Provide your API key to use Claude 3 models.
   - **LM Studio / OpenAI Compatible**: Use a local LLM running on your machine.
4. Set the **API Base URL** (default for LM Studio is
   `http://localhost:1234/v1`).

> [!TIP]
> Using a local LLM via LM Studio is a great way to play with high-quality AI
> responses for free!

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with modern aesthetics
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for
details.

---

_Made with ❤️ for car enthusiasts and sales pros._
