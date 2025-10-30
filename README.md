<div align="center"> 
  <h1> Aave Incentives API </h1>
</div>

# Abstract

This project provides an API to access incentives data from the Aave protocol. It enables developers and users to retrieve information about all the incentives across supported Aave instances.

# Setup

```bash
# Install packages
pnpm i

# Set env var
cp .example.env .env

# Then set your own env var in your freshly created .env file
```

```bash
# Start the development server
pnpm run dev
```

The API will be available at `http://localhost:3000`.

## Endpoints

```
GET /incentives

Parameters:
- chainId (optional): number
- status (optional): PAST, LIVE, SOON
- incentiveType (optional): ONCHAIN, OFFCHAIN, EXTERNAL
- rewardType (optional): TOKEN, POINTS
```

## Features

- Express REST API
- Fetch incentives across multiple sources:
  - ACI infra incentives
  - Merkl infra incentives
  - Onchain incentives
  - External Points incentives
- Support all Aave V3 instances.

## License

This project is licensed under the GPLv3 License. See the [LICENSE](LICENSE) file for details.
