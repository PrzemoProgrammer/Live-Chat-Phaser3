import Button from "./Button";
import chatConfig from "./ChatConfig";

export default class Chat {
  constructor(scene, x, y) {
    const {
      messageColor,
      nicknameColor,
      broadcastMessage,
      adminAnnouncementColor,
      textFont,
      inputTextMaxLength,
      messageOffsetY,
      maxScrollDownRange,
      maxMessagesOnChat,
      messagesContainerHeight,
      messagesContainerWidth,
    } = chatConfig;

    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isActive = false;
    this.isWriting = false;
    this.writtenSentence = "";
    this.nicknameText = "";
    this.messageText = "";
    this.messagesContainerStartY = null;
    this.messageTextHeight = null;
    this.messages = [];

    this.messageColor = messageColor;
    this.nicknameColor = nicknameColor;
    this.broadcastMessage = broadcastMessage;
    this.adminAnnouncementColor = adminAnnouncementColor;
    this.textFont = textFont;
    this.inputTextMaxLength = inputTextMaxLength;
    this.messageOffsetY = messageOffsetY;
    this.maxScrollDownRange = maxScrollDownRange;
    this.maxMessagesOnChat = maxMessagesOnChat;
    this.messagesContainerHeight = messagesContainerHeight;
    this.messagesContainerWidth = messagesContainerWidth;

    this.box = this.createBox();
    this.textBox = this.createTextBox();
    this.enterButton = this.createEnterButton();
    this.textInput = this.createTextInput();
    this.createContainer();
    this.createMessagesContainer();
  }
  createBox() {
    const sprite = chatConfig.chatBoxImage;
    return this.scene.add.image(0, 0, sprite).setAlpha(0);
  }

  createContainer() {
    this.container = this.scene.add
      .container(
        this.x + this.box.displayWidth / 2,
        this.y - this.box.displayHeight / 2,
        [this.box, this.textBox, this.enterButton]
      )
      .setSize(this.box.displayWidth, this.box.displayHeight)
      .setInteractive();
  }

  updateContainerHeight(height) {
    this.messagesContainer.setSize(this.messagesContainerWidth, height);
  }

  createMessagesContainer() {
    this.messagesContainer = this.scene.add
      .container(this.container.x, this.container.y)
      .setSize(this.messagesContainerWidth, 0);

    this.messagesContainerStartY = this.messagesContainer.y;

    this.container.on("wheel", (pointer, dx, dy, dz, event) => {
      if (this.isActive) {
        const newY = this.messagesContainer.y - dy * 0.2;
        if (
          !this.isMessagesContainerTooHigh(dy) &&
          !this.isMessagesContainerTooLow(dy)
        ) {
          this.updateContainerY(newY);
        }
      }
    });

    this.messagesMask = this.scene.make
      .image({
        x: this.container.x,
        y: this.container.y - 25,
        key: "chatMask",
        add: true,
      })
      .setVisible(false);

    this.messagesContainer.mask = new Phaser.Display.Masks.BitmapMask(
      this.scene,
      this.messagesMask
    );
  }

  isMessagesContainerTooLow(dy) {
    return (
      this.messagesContainer.y + this.messagesContainer.height >=
        this.maxScrollDownRange && dy < 0
    );
  }

  isMessagesContainerTooHigh(dy) {
    return this.messagesContainer.y <= this.messagesContainerStartY && dy >= 0;
  }

  updateContainerY(value) {
    this.messagesContainer.y = value;
  }

  resetMessagesPosition() {
    this.messagesContainer.y = this.messagesContainerStartY;
  }

  createTextBox() {
    const { image, offsetX, offsetY } = chatConfig.textBox;
    const x = this.box.x + this.box.displayWidth + offsetX;
    const y = this.box.y + this.box.displayHeight + offsetY;

    return this.scene.add.image(x, y, image).setAlpha(0);
  }

  createEnterButton() {
    const { image, offsetX, offsetY } = chatConfig.enterButton;
    const x = this.box.x + this.box.displayWidth - offsetX;
    const y = this.box.y + this.box.displayHeight - offsetY;

    const button = new Button(this.scene, x, y, image)
      .setAlpha(0)
      .setActive(false);
    this.enterButton.onClick(() => {
      this.manageChat();
    });

    return button;
  }

  createTextInput() {
    const config = {
      x: this.x + 210,
      y: this.y - 25,
      width: 400,
      height: 30,
      type: "text",
      multiline: true,
      placeholder: "Enter text",
      fontSize: "20px",
      fontFamily: this.textFont,
      color: "#ffffff",
      align: "left",
      maxLength: this.inputTextMaxLength,
      minLength: 0,
    };

    const text = this.scene.add
      .rexInputText(config)
      .setVisible(false)
      .setActive(false);

    text.on("textchange", ({ text }) => {
      this.writtenSentence = text;
    });
  }

  setTextStatus(value) {
    this.textInput.setVisible(value);
    this.textInput.setActive(value);
  }

  setEnterButtonStatus(number, value) {
    this.enterButton.setAlpha(number);
    this.enterButton.setActive(value);
  }

  turnOn() {
    this.isActive = true;
    this.setTextStatus(true);
    this.textBox.setAlpha(1);
    this.setEnterButtonStatus(1, true);
    this.box.setAlpha(1);
  }

  turnOff() {
    this.isActive = false;
    this.setTextStatus(false);
    this.box.setAlpha(0);
    this.setEnterButtonStatus(0, false);
    this.textBox.setAlpha(0);
    this.resetMessagesPosition();
  }

  isOpenAndNoWriting() {
    return this.isActive && this.writtenSentence === "";
  }

  isOpenAndWriting() {
    return this.isActive && this.writtenSentence !== "";
  }

  clearTextBox() {
    this.textInput.setText("");
    this.writtenSentence = "";
  }

  manageChat(cb) {
    if (this.isOpenAndNoWriting()) {
      this.turnOff();
      return;
    }

    if (this.isOpenAndWriting()) {
      if (this.messagesContainerStartY != "") cb();
      this.clearTextBox();
    } else {
      this.turnOn();
    }
  }

  getWrittenSentence() {
    return this.writtenSentence;
  }

  updateMessageAbovePlayer(x, y) {
    this.textAbovePlayer.x = x;
    this.textAbovePlayer.y = y;
  }

  createTextMessage(x, y, data) {
    let { nickname, message } = data;
    let messageContent = "";

    this.nicknameText = addText(this.scene, x, y, nickname, this.nicknameColor);

    messageContent = nickname + ": " + message;

    this.messageText = addText(
      this.scene,
      x,
      y,
      messageContent,
      this.messageColor
    );

    this.messageTextHeight = this.messageText.height;

    this.setupMessageColor(nickname);
  }

  setupMessageColor(nickname) {
    let color = "";

    switch (nickname) {
      case "World":
        color = this.broadcastMessageColor;
        break;
      case "Admin":
        color = this.adminAnnouncementColor;
        break;
      default:
        return;
    }

    this.setMessageColor(color);
  }

  setMessageColor(color) {
    [this.nicknameText, this.messageText].forEach((text) => {
      text.setColor(color);
    });
  }

  addToMessages(message) {
    this.messagesContainer.add([message]);
    this.messages.unshift(message);
  }

  messagesAreFull() {
    return this.messages.length > this.maxMessagesOnChat;
  }

  deleteLastMessage() {
    this.messages.splice(-2).forEach((message) => message.destroy());
  }
  moveMessagesUp(value) {
    this.messages.map((message) => (message.y -= value));
  }

  addTextMessageToMessages(message) {
    message.forEach((text) => {
      this.addToMessages(text);
    });
  }

  setupMessageOffset() {
    return this.messageTextHeight % this.messageOffsetY === 0 &&
      this.messageTextHeight != this.messageOffsetY
      ? this.messageOffsetY * (this.messageTextHeight / this.messageOffsetY)
      : this.messageOffsetY;
  }

  areMessagesOutsideChatWindow() {
    return (
      this.messages.length >= 32 &&
      this.messages.length !== this.maxMessagesOnChat
    );
  }

  updateMaxScrollRange(offset) {
    this.maxScrollRange += offset;
  }

  addTextToConversation(data) {
    let x = this.box.x - 250;
    let y = this.box.y + 70;
    let largeMessageOffset = null;

    this.createTextMessage(x, y, data);

    let wholeMessage = [this.messageText, this.nicknameText];

    this.addTextMessageToMessages(wholeMessage);

    largeMessageOffset = this.setupMessageOffset();
    this.messagesContainerHeight += largeMessageOffset;
    this.moveMessagesUp(largeMessageOffset);

    if (this.messagesAreFull()) {
      this.deleteLastMessage();
      return;
    }

    this.updateContainerHeight(-this.messagesContainerHeight);
  }
}

function addText(scene, x, y, text, color) {
  return scene.add.text(x, y, text, {
    fontFamily: "slkscr",
    fontSize: "20px",
    color: color,
    strokeThickness: 1,
    stroke: "#000000",
    wordWrap: { width: 500 },
    shadow: { blur: 0, stroke: false, fill: false },
  });
}
