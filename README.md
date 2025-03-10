# AI Finance 2025

A modern financial management application that leverages AI capabilities and integrates with banking services through the Basiq API.

## Features

- Bank account connection through Basiq API
- Secure user authentication
- Transaction history viewing
- Real-time bank data synchronization

## Setup

1. Clone the repository:
```bash
git clone https://github.com/niro-code/AI_Finance_2025.git
cd AI_Finance_2025
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the project root with your Basiq API credentials:
```
NEXT_PUBLIC_BASIQ_API_KEY=your_api_key_here
NEXT_PUBLIC_BASIQ_APPLICATION_ID=your_application_id_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `NEXT_PUBLIC_BASIQ_API_KEY`: Your Basiq API key
- `NEXT_PUBLIC_BASIQ_APPLICATION_ID`: Your Basiq Application ID

## Tech Stack

- Next.js
- TypeScript
- Basiq API for bank connections
- Tailwind CSS for styling

## Development

The application is built with Next.js and TypeScript, providing a modern and type-safe development experience. We use the Basiq API for bank connections and data retrieval.

## Security

- API keys are stored in environment variables
- All sensitive data is handled server-side
- HTTPS encryption for all API calls
- User data is properly sanitized and validated

## License

MIT