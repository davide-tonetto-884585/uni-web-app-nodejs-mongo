# Configuration

> **ATTENTION:** this guide is made for windows.

## Installation

1. Install [Node.js](https://nodejs.org/en/download/)
2. Install [MongoDB](https://www.mongodb.com/download-center/community)
3. Install Angular CLI globally: `npm install -g @angular/cli`
4. Download files from this repository and open the downloaded folder in terminal
5. Move to `backend` folder and run `npm install`
6. In `backend` folder create a new file `.env` and add the following lines:

    ```env
    JWT_SECRET=...
    MAIL=...
    MAIL_HOST=...
    MAIL_PORT=...
    MAIL_PW=...
    ```
   *replace the `...` with yours information.*
7. Move to `frontend` folder and run `npm install`

## Application launch

1. Move to `backend` folder and run `npm run dev`
2. Move to `frontend` folder and run `ng serve`
3. Open `http://localhost:4200/` in your browser