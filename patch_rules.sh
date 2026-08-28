#!/bin/bash
sed -i '/match \/users\/.*{/i \
    function isValidFollow(data) {\
      return data.keys().hasAll(["followerId", "followingId", "createdAt"]) &&\
             data.followerId is string && data.followerId == request.auth.uid &&\
             data.followingId is string &&\
             data.createdAt is string;\
    }\
' firestore.rules

sed -i '/match \/activities\/{activityId} {/i \
    match /follows/{followId} {\
      allow read: if true;\
      allow create: if isSignedIn() && isValidFollow(incoming());\
      allow delete: if isSignedIn() && existing().followerId == request.auth.uid;\
    }\
' firestore.rules
