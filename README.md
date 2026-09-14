# LexAid

LexAid is a React Native (Expo) mobile app for law students and legal practitioners. It combines case management, a task list with calendar, legal calculators, and spaced-repetition flashcards for legal English, in one privacy-first workspace.

## Key features

LexAid is not just a bunch of tools put together. The design comes from real needs that I collected from law students and legal practitioners, and these are the things that make it different:



* **Case-based workflow.** A to-do task can be linked to a case, so when you open a case you can see everything that still needs to be done for it, and filter tasks by case. Legal work is case-oriented, so the app works the same way.

* **Court date weather & travel risk.** After you input a court date, the case detail page shows a weather forecast for that date with a travel risk note (low / moderate / high). Bad weather can postpone hearings or make it hard to travel to court, so it is useful to check this without leaving the app. It uses the free Open-Meteo API (no API key needed).

* **Legal English flashcards with spaced repetition.** Legal English is full of Latin terms and words that mean something different from daily English. Users can add any term they meet and review it in free time; the interval grows when you remember it and resets when you forget it.

* **Working day calculator.** In personal injury, employment and compensation cases, the number of working days is often the key part of the calculation. LexAid counts working days between two dates automatically, with the England & Wales bank holidays built in.

* **Privacy first.** All data is stored locally on the device (AsyncStorage). No account, no login, no uploading sensitive legal information to a server.

* **Accessibility built in.** Three font sizes that apply globally, reduce-motion support, and light / dark / system themes.

## Run the app

Requirements: Node.js, and the Expo Go app on your phone (or an emulator).



```
npm install

npm start
```

Then scan the QR code with Expo Go. You can also run directly on an emulator:



```
npm run android   # or npm run ios
```

## Test



```
npm test
```

The project uses Jest with the jest-expo preset. Business logic is kept in `utils/` so it can be tested without rendering the UI. There are 74 tests covering the fee math, the schedulers, the bank holidays, the weather logic and the review flow.

## Project structure



```
App.js                 root component

navigation/            bottom tabs + stacks

screens/               page components (Cases, Tasks, Calculator, Terms, Settings)

utils/                 business logic (schedulers, fee math, weather)

contexts/              global settings (theme, font size, notifications)

data/                  seed data

\_\_tests\_\_/             jest tests
```

## Notes



* The weather feature needs an internet connection; all other features work offline.

* For submission, zip the project with `node_modules/` removed.