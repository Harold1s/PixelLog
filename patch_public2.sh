#!/bin/bash
sed -i 's/<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">/<div className="grid grid-cols-4 gap-2 sm:gap-4">/g' src/pages/PublicProfilePage.tsx
