var profile;
var onlineUsers;
$(".type_msg").on('keyup', function () {
    let uuid = $(this).attr('uuid');
    showTyping(uuid);
});

$('.type_msg').keydown(function (e) {
    if (e.which == 13) {
        e.preventDefault();
        let uuid = $(this).attr('uuid');
        let msg = $(this).val();
        if (!msg) return;
        $(this).val('');
        sendMessage(uuid, msg);
    }
});

$(".add-to-group").on('click', () => {
    renderGroupModal();
    let uuid = $('.type_msg').attr('uuid');
    $(`input[value=${uuid}]`).prop('checked', true);
    $('#groupModal').modal()
});

$(".create-group-btn").on("click", () => {
    let groupName = $('.group-name').val();
    let selectedUsers = [];
    $.each($("input[name='group']:checked"), function () {
        selectedUsers.push($(this).val());
    });

    if (!groupName && !selectedUsers.length) return;
    $('#groupModal').modal('hide');
    createGroup(groupName, selectedUsers);

})

window.addEventListener('onlineUsers', event => {
    onlineUsers = event.detail || [];
    renderOnlineUsers(event.detail);
});

window.addEventListener('newMessage', event => {
    let uuid = $('.type_msg').attr('uuid');
    let msg = event.detail;
    let selector = $('#' + msg.senderId);
    if (msg.gid) selector = $('#' + msg.gid);
    let counter = selector.find('.unseen').attr('counter') || 0;
    counter = +counter;
    if ((uuid === msg.senderId && !msg.gid) || msg.self || uuid === msg.gid) {
        appendChat(event.detail);
    }
    else {
        counter++;
        selector.find('.unseen').attr('counter', counter + '');
        selector.find('.unseen').text(counter);
    }
});

window.addEventListener('typing', event => {
    $(".typing").text(event.detail.message);
    setTimeout(() => {
        $(".typing").text('');
    }, 1000)
});

window.addEventListener('usersUpdated', event => {
    let uuid = $('.type_msg').attr('uuid');
    getChattingPartnerProfile(uuid);
});

window.addEventListener('profile', event => {
    renderProfile(event.detail);
});

window.addEventListener('userProfile', event => {
    renderChatWithUser(event.detail);
});

window.addEventListener('chatMessages', event => {
    chats = event.detail;
    renderChats(chats)
});

function renderOnlineUsers(onloneUsers) {
    let users = "";
    for (let [i, val] of onloneUsers.entries()) {
        users += `
        <li class="online-user" uuid="${val.uuid}" type="${val.type || 'u'}">
            <div class="d-flex bd-highlight" id="${val.uuid}">
                <div class="img_cont">
                    <img src="assets/images/user.png"
                        class="rounded-circle user_img">
                    <span class="online_icon online"></span>
                </div>
                <div class="user_info">
                    <span>${val.name} <span class="badge badge-danger unseen"></span> </span>
                    <p>Online</p>
                </div>
            </div>
        </li>`;
    }

    $("#onlineUsers").html(users);
    $(".online-user").on('click', function (event) {
        $(".online-user").removeClass("active");
        $(this).addClass("active");
        $(this).find('.unseen').text('');
        $(this).find('.unseen').attr('counter', '0');
        let uuid = $(this).attr('uuid');
        let type = $(this).attr('type');
        getChattingPartnerProfile(uuid);
        getChattingMassages(uuid);
        $('.type_msg').attr('uuid', uuid);
        $('.type_msg').attr('type', type);
        $('.chat-box').css('display', 'block');
        $('.default-msg').css('display', 'none');
    });
};

function renderProfile(profile) {
    $("#profile").html(`
    <li uuid="${profile.uuid}">
            <div class="d-flex bd-highlight">
                <div class="img_cont">
                    <img src="assets/images/self.jpg"
                        class="rounded-circle user_img">
                    <span class="online_icon online"></span>
                </div>
                <div class="user_info">
                    <input type="text" value="${profile.name}" id="username"><button onclick="saveName()">Save</button>
                    <p>Online</p>
                </div>
            </div>
        </li>
    `);
};

function renderChatWithUser(profile) {
    $(".chat-user-name").text(profile.name);
};

function saveName() {
    var name = $("#username").val();
    changeName(name);
};

function renderChats(chats) {
    let chatHtml = '';
    let slf = $("#profile").find('li').attr('uuid');
    for (let chat of chats) {
        if (chat.senderId === slf) {
            chatHtml += `
                <div class="d-flex justify-content-end mb-4">
                    <div class="msg_cotainer_send">
                        ${chat.message}
                        <span class="msg_time_send">${new Date(chat.ts).toLocaleString().split(',')[1]}</span>
                    </div>
                    <div class="img_cont_msg">
                        <img src="assets/images/self.jpg"  class="rounded-circle user_img_msg">
                    </div>
                </div>
            `;
        } else {
            chatHtml += `
                <div class="d-flex justify-content-start mb-4">
                    <div class="img_cont_msg">
                        <img src="assets/images/user.png" class="rounded-circle user_img_msg">
                    </div>
                    <div class="msg_cotainer">
                        ${chat.message}
                        <span class="msg_time">${new Date(chat.ts).toLocaleString().split(',')[1]}</span>
                    </div>
                </div>
            `;
        }
    }
    $('.msg_card_body').html(chatHtml);
    $(".msg_card_body").animate({ scrollTop: $('.msg_card_body').prop("scrollHeight") }, 10);
};

function appendChat(chat) {
    let slf = $("#profile").find('li').attr('uuid');
    let chatHtml = '';
    if (chat.senderId === slf) {
        chatHtml += `
            <div class="d-flex justify-content-end mb-4">
                <div class="msg_cotainer_send">
                    ${chat.message}
                    <span class="msg_time_send">${new Date(chat.ts).toLocaleString().split(',')[1]}</span>
                </div>
                <div class="img_cont_msg">
                    <img src="assets/images/self.jpg"  class="rounded-circle user_img_msg">
                </div>
            </div>
        `;
    } else {
        chatHtml += `
            <div class="d-flex justify-content-start mb-4">
                <div class="img_cont_msg">
                    <img src="assets/images/user.png" class="rounded-circle user_img_msg">
                </div>
                <div class="msg_cotainer">
                    ${chat.message}
                    <span class="msg_time">${new Date(chat.ts).toLocaleString().split(',')[1]}</span>
                </div>
            </div>
        `;
    }
    $('.msg_card_body').append(chatHtml);
    $(".msg_card_body").animate({ scrollTop: $('.msg_card_body').prop("scrollHeight") }, 10);
};

function renderGroupModal() {
    var liStr = "";
    for (let user of onlineUsers) {
        liStr += `<li><input type="checkbox" name="group" value="${user.uuid}"> ${user.name}</li>`
    }
    $(".selectedUsers").html(liStr);
};