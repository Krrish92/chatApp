var cookie = require('cookie');
const crypto = require("crypto");

module.exports = class WebsocketController {
    constructor(server) {
        this.server = server;
        this.activeUsers = {};
        this.chats = {};
    }

    connect() {
        this.server.on('connect', async socket => {
            let cookieData = cookie.parse(socket.handshake.headers.cookie)
            let data = {
                uuid: cookieData.uuid,
                name: cookieData.uuid
            }

            console.log("Active Users ::", this.activeUsers);
            if (!this.activeUsers.hasOwnProperty(data.uuid))
                this.activeUsers[data.uuid] = data;

            const username = data.uuid;
            socket.user = username;
            await this.joinRoom(socket, username);

            socket.broadcast.emit('users updated');

            //set nick name
            socket.on('change name', (name) => {
                this.activeUsers[socket.user]['name'] = name;
                //send event to all tabs
                socket.in(socket.user).emit('profile', this.activeUsers[socket.user]);
                //send online users to all clients 
                socket.broadcast.emit('users updated');
            });

            //get Profile
            socket.on('get profile', () => {
                //send profile to sender
                socket.emit('profile', this.activeUsers[socket.user]);
            });

            //get online users
            socket.on('get online users', async () => {
                socket.emit('online users', await this.onlineUsers(socket))
            });

            //get a chatting partner profile
            socket.on('get user profile', (uuid, cb) => {
                cb(this.activeUsers[uuid]);
            });

            //get a chatting partner profile
            socket.on('get chats', (uuid, cb) => {
                let key = uuid;
                if (this.activeUsers[uuid].type != 'g') key = this.generateChatKey(socket.user, uuid);
                cb(this.chats[key] || []);
            });

            //show typing
            socket.on('typing', (uuid) => {
                socket.to(uuid).emit('typing', { message: `${this.activeUsers[socket.user].name} is typing ...` })
            });

            //Create group
            socket.on('create group', (gname, uuids) => {
                let gid = crypto.randomBytes(16).toString("hex");
                this.activeUsers[gid] = {
                    uuid: gid,
                    name: gname,
                    type: 'g',
                    uuids: [...uuids, socket.user]
                };
                for (let uuid of uuids) {
                    socket.to(uuid).emit('group request', gid);
                }
                socket.emit('group request', gid);
            });

            socket.on('group response', async (gid) => {
                await this.joinRoom(socket, gid);
                socket.emit('users updated');

            });

            //send a meessage
            socket.on('send messsage', (uuid, msg) => {
                let message = {
                    message: msg,
                    senderName : this.activeUsers[socket.user].name,
                    senderId: socket.user,
                    receiverId: uuid,
                    ts: Date.now()
                };
                let key = this.generateChatKey(socket.user, uuid);
                if (this.activeUsers[uuid].type == 'g') {
                    key = uuid;
                    message['gid'] = uuid;
                }
                if (this.chats.hasOwnProperty(key)) {
                    this.chats[key].push(message);
                } else {
                    this.chats[key] = [message];
                }

                // if(this.activeUsers[uuid].type =='g') {
                //     socket.emit('new message', message);
                //     return;
                // }
                socket.to(uuid).emit('new message', message);
                socket.emit('new message', { ...message, self: true });
                socket.in(socket.user).emit('new message', { ...message, self: true });
            });

            socket.on('disconnect', (data) => {
                this.server.in(socket.user).clients((err, client) => {
                    if (!client.length) {
                        socket.broadcast.emit('users updated');
                    }
                });

                console.log(`User disconnected ${socket.user}`);
            })
        });
    }

    async onlineUsers(socket) {
        let users = [];
        for (let key in this.activeUsers) {
            if (this.activeUsers[key].type == 'g' && this.activeUsers[key].uuids.indexOf(socket.user) == -1) {
                continue;
            }
            let client = await this.getClientsInARoom(key);
            if (client.length) {
                if (key !== socket.user) {
                    users.push(this.activeUsers[key]);
                }
            } else {
                console.log('All client disconnected')
            }
        }
        return users;
    }

    joinRoom(socket, room) {
        return new Promise((resolve) => {
            socket.join(room, () => {
                console.log(`Socket now joined to ${socket.user}`);
                resolve(true);
            });
        });
    }

    getClientsInARoom(room) {
        return new Promise(resolve => {
            this.server.in(room).clients((err, client) => {
                resolve(client);
            });
        })
    }

    generateChatKey(u1, u2) {
        if (u1 > u2) return `${u1}_${u2}`;
        return `${u2}_${u1}`;
    }
}
