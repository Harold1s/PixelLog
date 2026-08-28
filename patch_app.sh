#!/bin/bash
sed -i 's/import ListsPage from ".\/pages\/ListsPage";/import ListsPage from ".\/pages\/ListsPage";\nimport FriendsActivityPage from ".\/pages\/FriendsActivityPage";/g' src/App.tsx
sed -i 's/{ name: '"'"'قوائمي'"'"', path: '"'"'\/lists'"'"', icon: ListVideo, requiresAuth: true },/{ name: '"'"'قوائمي'"'"', path: '"'"'\/lists'"'"', icon: ListVideo, requiresAuth: true },\n    { name: '"'"'نشاطات الأصدقاء'"'"', path: '"'"'\/friends-activity'"'"', icon: Users, requiresAuth: true },/g' src/App.tsx
sed -i 's/import { Menu, X, Home, Search, User, LogOut, Gamepad2, Settings, ListVideo, Flame } from '"'"'lucide-react'"'"';/import { Menu, X, Home, Search, User, LogOut, Gamepad2, Settings, ListVideo, Flame, Users } from '"'"'lucide-react'"'"';/g' src/App.tsx
sed -i 's/<Route path="\/lists" element={<ListsPage \/>} \/>/<Route path="\/lists" element={<ListsPage \/>} \/>\n          <Route path="\/friends-activity" element={<FriendsActivityPage \/>} \/>/g' src/App.tsx
