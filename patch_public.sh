#!/bin/bash
sed -i 's/userData.favoriteGames/userData.topGames/g' src/pages/PublicProfilePage.tsx
sed -i 's/slice(0, 10)/slice(0, 5)/g' src/pages/PublicProfilePage.tsx
sed -i 's/الألعاب المفضلة/أفضل 4 ألعاب (Top 4)/g' src/pages/PublicProfilePage.tsx
