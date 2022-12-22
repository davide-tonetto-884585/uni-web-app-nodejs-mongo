# Configuration

> **ATTENTION:** this guide is made for windows.

## Installation

1. Install [Node.js](https://nodejs.org/en/download/)
2. Install [MongoDB](https://www.mongodb.com/download-center/community)
3. Install Angular CLI globally: `npm install -g @angular/cli`
4. Open this folder in terminal
5. Move to `project_source_code/backend` folder and run `npm install`
6. Inside `project_source_code/backend` folder create a new file `.env` and add the following lines:

    ```env
    JWT_SECRET=...
    MAIL=...
    MAIL_HOST=...
    MAIL_PORT=...
    MAIL_PW=...
    DB_NAME=...
    DB_HOST=...
    DB_PORT=...
    ```
   *replace the `...` with yours information.*
7. Move to `project_source_code/frontend` folder and run `npm install`
8. Create a *new database* on MongoDB called as in your `.env` file
9. Create a *new collection* called `schools` on your database
10. Import `scuole_italiane.json` in the collection `schools`

## Application launch

1. Move to `project_source_code/backend` folder and run `npm run dev`
2. Move to `project_source_code/frontend` folder and run `ng serve`
3. Open `http://localhost:4200/` in your browser

## Admin account

The backend code will create automatically an admin account with the following credentials:

- `mail: admin@PCTODAIS.it`
- `password: admin`
