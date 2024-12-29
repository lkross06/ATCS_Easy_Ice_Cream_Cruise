![image](https://github.com/user-attachments/assets/3eacd4b8-cd85-4413-bbe6-c66fe931e10f)

# Easy Ice Cream Cruise

**This was the final group project in ATCS2, taken at The Head-Royce School and taught by Mr. Sea. The project was submitted on January 5th, 2024 by Lucas Kalani Ross, Everett Villiger and Finn Taylor.**

## Introduction

Easy Ice Cream Cruise is a *thrilling* 3D online racing game designed to immerse players in a world of high-speed competition. This game transports players into online race tracks where they can experience the exhilaration of racing against the clock and their friends. With realistic physics and beginner-friendly mechanics, Easy Ice Cream Cruise offers an authentic racing experience that tests driving skills and strategic thinking. The game features eight tracks of varying difficulty, catering to both beginners and seasoned racers. Challenge your friends to see who can dominate the leaderboards or set a new record time in this adrenaline-fueled racing extravaganza!

## Features

- Multiplayer Gameplay
  - users may host servers with global IPv4 address that allows other users on the same LAN to connect
  - once on a server, players may host and join each others' private games with game codes
  - game engine updates via UDP connection based on slowest client's latency to make games fair
- Account Login System
  - passwords hashed with SHA256
  - JSON-encoded account information stored locally
  - stores username, password hash, personal best times, and movement keybinds
- Global Leaderboard + Online Chat
  - leaderboards for each track update based on account information
  - online chat via TCP connection sends messages between clients to all other clients on the same server
- Track Builder
  - 3D models for tracks encoded in locally-stored TXT files that game engine decodes and builds
  - users may build their own tracks by editing track TXT files

## Dependencies

All of the code written for this project was assembled in Visual Studio Code using [Node.js](https://nodejs.org). In completing our project, we utilized a range of Node.js libraries, as well as other JavaScript libraries, selected for their specific functionalities and compatibility with our objectives. They are as follows:

- [Node.js](https://nodejs.org)
  - [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
  - [express.js](https://expressjs.com)
- [three.js](https://threejs.org)
- [cannon.js](https://schteppe.github.io/cannon.js/)
- [ws](https://github.com/websockets/ws/)
