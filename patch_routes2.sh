#!/bin/bash
sed -i "s/import HomePage from '.\/pages\/HomePage';/import HomePage from '.\/pages\/HomePage';\nimport PopularGamesPage from '.\/pages\/PopularGamesPage';\nimport UpcomingGamesPage from '.\/pages\/UpcomingGamesPage';/g" src/App.tsx
