const socket = io('http://localhost:8080', {
    path: '/ws'
});

var _bindEvents = () => {
    socket.on('connect', () => {
        console.log(`Client connected to server`);
        getOnlineUsers();
        getUserProfile();
    });

    socket.on('heartBeat', (msg) => {
        console.log(msg);
    });

    socket.on('group request', (gid) => {
        socket.emit('group response', gid);
    });

    socket.on('typing', (data) => {
        window.dispatchEvent(new CustomEvent('typing', {detail : data}));
    });

    socket.on('profile', (data) => {
        console.log('Got profile ::', data)
        window.dispatchEvent(new CustomEvent('profile', {detail : data}));
    });

    socket.on('online users', (data) => {
        console.log('Got online users ::', data);
        window.dispatchEvent(new CustomEvent('onlineUsers', {detail : data}));
    })

    socket.on('users updated', () => {
        getOnlineUsers();
        window.dispatchEvent(new CustomEvent('usersUpdated'));
    })

    socket.on('new message', (message) => {
        console.log('New message arrived ::', message);
        window.dispatchEvent(new CustomEvent('newMessage', {detail : message}));
    })
};

var getOnlineUsers = () => {
    socket.emit('get online users');
};

var getUserProfile = () => {
    socket.emit('get profile');
};

var changeName = (name) => {
    socket.emit('change name', name);
};

var getChattingPartnerProfile = (uuid) => {
    socket.emit(`get user profile`, uuid, (profile) => {
        console.log('Chatting partner profile ::', profile);
        window.dispatchEvent(new CustomEvent('userProfile', {detail : profile}));
    });
};

var getChattingMassages = (uuid) => {
    socket.emit(`get chats`, uuid, (chat) => {
        window.dispatchEvent(new CustomEvent('chatMessages', {detail : chat}));
    });
}

var showTyping = (uuid) => {
    socket.emit('typing', uuid);
}

var sendMessage = (uuid, msg) => {
    socket.emit('send messsage', uuid, msg);
}

var createGroup = (gname, uuids) => {
    socket.emit('create group', gname, uuids);
}


_bindEvents();