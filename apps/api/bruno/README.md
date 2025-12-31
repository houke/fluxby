# Fluxby API - Bruno Collection

This folder contains a [Bruno](https://www.usebruno.com/) API collection for testing the Fluxby API.

## Getting Started

1. Install Bruno from [usebruno.com](https://www.usebruno.com/)
2. Open Bruno and select "Open Collection"
3. Navigate to this `bruno/` folder
4. Select the `local` environment from the environment dropdown

## Structure

```
bruno/
├── bruno.json              # Collection configuration
├── environments/
│   └── local.bru           # Local development environment
├── accounts/               # Bank account endpoints
├── addressbook/            # Contact/address book endpoints
├── analytics/              # Dashboard and statistics endpoints
├── budgets/                # Budget management endpoints
├── categories/             # Category and rule endpoints
├── import/                 # CSV import endpoints
├── profiles/               # Profile management endpoints
└── transactions/           # Transaction endpoints
```

## Environment Variables

The `local` environment includes:

- `baseUrl`: `http://localhost:3001/api`
- `profileId`: `1` (default profile)

## Adding New Endpoints

When adding a new API endpoint, always create a corresponding Bruno request file:

1. Create a new `.bru` file in the appropriate folder
2. Follow the naming convention: `Verb Noun.bru` (e.g., `Get All Accounts.bru`)
3. Include documentation in the `docs` section
4. Add example request bodies where applicable

### Template

````bru
meta {
  name: Your Endpoint Name
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/your-endpoint
  body: none
  auth: none
}

headers {
  X-Profile-Id: {{profileId}}
}

docs {
  # Your Endpoint Name

  Description of what this endpoint does.

  ## Parameters

  - `param1`: Description

  ## Response

  ```json
  {
    "success": true,
    "data": {}
  }
````

}

````

## Running the API

Before using this collection, start the API server:

```bash
npm run dev
````

The API will be available at `http://localhost:3001/api`.

## Swagger Documentation

Interactive API documentation is also available at:
`http://localhost:3001/api/docs`
