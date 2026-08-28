#!/bin/bash
sed -i 's/import { Gamepad2, Loader2, Star, CheckCircle2, ListTodo, ChevronDown } from "lucide-react";/import { Gamepad2, Loader2, Star, CheckCircle2, ListTodo, ChevronDown, UserPlus, UserMinus } from "lucide-react";/g' src/pages/PublicProfilePage.tsx
sed -i "s/import { doc, getDoc, collection, query, where, getDocs } from 'firebase\/firestore';/import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase\/firestore';/g" src/pages/PublicProfilePage.tsx
sed -i 's/import { useStore } from "\.\.\/store\/useStore";\n//g' src/pages/PublicProfilePage.tsx
sed -i '1i import { useStore } from "../store/useStore";' src/pages/PublicProfilePage.tsx

