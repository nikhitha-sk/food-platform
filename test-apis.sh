#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Food Platform API Testing ===${NC}\n"

# Test 1: Register a user
echo -e "${BLUE}[TEST 1] Register New User${NC}"
TIMESTAMP=$(date +%s%N | cut -b1-13)
PHONE="+1555$(printf '%07d' $((RANDOM * 32768 + RANDOM)))"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"'$TIMESTAMP'@test.com",
    "password":"Pass@12345",
    "phone":"'$PHONE'",
    "role":"customer"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id // empty')
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$USER_ID" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Registration failed${NC}\n"
  exit 1
fi

echo -e "${GREEN}✓ User registered: ID=$USER_ID${NC}\n"

# Wait a bit for the event to be consumed
sleep 2

# Test 2: Verify profile was created in user-service
echo -e "${BLUE}[TEST 2] Verify Profile Created via Event${NC}"
PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8002/api/v1/users/$USER_ID)

echo "$PROFILE_RESPONSE" | jq '.'
if echo "$PROFILE_RESPONSE" | jq -e '.auth_id' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Profile found in user-service (event was consumed)${NC}\n"
else
  echo -e "${RED}⚠ Profile not found or error${NC}\n"
fi

# Test 3: Add an address
echo -e "${BLUE}[TEST 3] Add Address${NC}"
ADDRESS_RESPONSE=$(curl -s -X POST http://localhost:8002/api/v1/users/$USER_ID/addresses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label":"Home",
    "line1":"123 Main Street",
    "city":"New York",
    "pincode":"10001",
    "latitude":40.7128,
    "longitude":-74.0060
  }')

echo "$ADDRESS_RESPONSE" | jq '.'
echo

# Test 4: List addresses
echo -e "${BLUE}[TEST 4] List Addresses${NC}"
LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8002/api/v1/users/$USER_ID/addresses)

echo "$LIST_RESPONSE" | jq '.'
echo

# Test 5: Delete account (triggers USER_DELETED event)
echo -e "${BLUE}[TEST 5] Delete Account (triggers event)${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:8001/api/v1/auth/account \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$DELETE_RESPONSE" | jq '.'
echo

# Wait for event processing
sleep 2

# Test 6: Verify profile was deleted
echo -e "${BLUE}[TEST 6] Verify Profile Deleted via Event${NC}"
GET_DELETED=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8002/api/v1/users/$USER_ID)

echo "$GET_DELETED" | jq '.'
if echo "$GET_DELETED" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Profile  deleted (event was consumed)${NC}\n"
else
  echo -e "${RED}⚠ Profile still exists${NC}\n"
fi

echo -e "${GREEN}=== Testing Complete ===${NC}"
