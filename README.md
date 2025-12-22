<div align="center"> 
  <h1> Aave Incentives API </h1>
    <p> ➡️ Live on <a href="https://aave-incentives-api.vercel.app">https://aave-incentives-api.vercel.app</a> </p>
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

The API will be available at `http://localhost:3000`

## API Docs

This API is fully documented using OpenAPI:

- 📘 Docs: https://aave-incentives-api.vercel.app/docs
- 📄 [OpenAPI file](public/openapi.yaml)

## API Overview

The API exposes a REST interface to query Aave incentives data.

- GET /incentives: Retrieve a list of incentives with optional filters for chain ID, status, incentive type, and reward type
- GET /status-data: Check the health status of the API
- GET /wrapper-tokens: Retrieve the list of all supported wrapper tokens and their underlying assets
- GET /wrapper-tokens/:wrapperTokenAddress: Resolve the underlying asset for a given wrapper token address

## Features

- Node.js Express REST API
- Fetch incentives across multiple sources:
  - [ACI infra incentives](https://apps.aavechan.com/merit)
  - [Merkl infra incentives](https://app.merkl.xyz/)
  - [Onchain incentives](https://search.onaave.com/?q=DEFAULT_INCENTIVES_CONTROLLER)
  - [External Points incentives](src/providers/external-points-provider/config/data.ts)
- Support all Aave V3 instances

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
