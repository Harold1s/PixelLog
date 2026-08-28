#!/bin/bash
sed -i 's/const \[favoriteGamesData, setFavoriteGamesData\] = useState<Game\[\]>(\[\]);/const \[topGamesData, setTopGamesData\] = useState<Game\[\]>(\[\]);\n  const \[showSearchModal, setShowSearchModal\] = useState(false);\n  const \[searchQuery, setSearchQuery\] = useState("");\n  const \[searchResults, setSearchResults\] = useState<Game\[\]>(\[\]);\n  const \[searching, setSearching\] = useState(false);/' src/pages/ProfilePage.tsx

sed -i 's/userProfile?.favoriteGames/userProfile?.topGames/g' src/pages/ProfilePage.tsx
sed -i 's/userProfile.favoriteGames/userProfile.topGames/g' src/pages/ProfilePage.tsx
sed -i 's/setFavoriteGamesData/setTopGamesData/g' src/pages/ProfilePage.tsx
sed -i 's/slice(0, 10)/slice(0, 5)/g' src/pages/ProfilePage.tsx
sed -i 's/favoriteGamesData\[index\]/topGamesData\[index\]/g' src/pages/ProfilePage.tsx
sed -i 's/الألعاب المفضلة/أفضل 4 ألعاب (Top 4)/g' src/pages/ProfilePage.tsx

