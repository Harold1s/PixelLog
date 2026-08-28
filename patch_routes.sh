#!/bin/bash
sed -i 's/import HomePage from ".\/pages\/HomePage";/import HomePage from ".\/pages\/HomePage";\nimport PopularGamesPage from ".\/pages\/PopularGamesPage";\nimport UpcomingGamesPage from ".\/pages\/UpcomingGamesPage";/g' src/App.tsx
sed -i 's/<Route path="\/" element={<HomePage \/>} \/>/<Route path="\/" element={<HomePage \/>} \/>\n          <Route path="\/popular" element={<PopularGamesPage \/>} \/>\n          <Route path="\/upcoming" element={<UpcomingGamesPage \/>} \/>/g' src/App.tsx

sed -i 's/to="\/search" className="flex flex-col items-center gap-2 text-neutral-400 hover:text-white p-8"/to="\/popular" className="flex flex-col items-center gap-2 text-neutral-400 hover:text-white p-8"/g' src/pages/HomePage.tsx

