const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.db',
    logging: false
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connected!');
    } catch (error) {
        console.error('Unable to connect :(', error);
    }
}
testConnection();


const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },

    email: {
        type: DataTypes.STRING(320),
        required: true,
        unique: true,
        allowNull: false
    },

    password: {
        type: DataTypes.STRING(80),
        required: true,
        allowNull: false
    },

    created_at: {
        type: DataTypes.DATE
    },

    tableName: "Users"
})

const Message = sequelize.define("Message", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },

    message: {
        type: DataTypes.STRING(500),
        unique: false,
        allowNull: false
    },

    sender: {
        type: DataTypes.STRING,
        allowNull: false
    },

    receiver: {
        type: DataTypes.STRING,
        allowNull: false
    },

    roomCode: {
        type: DataTypes.STRING(641),
        allowNull: false
    },

    created_at: {
        type: DataTypes.DATE
    },

    tableName: "Messages"
})

User.hasMany(Message);
Message.belongsTo(User);

async function updateTables() {
    await sequelize.sync({ alter: true })
}

updateTables();

module.exports = {
    User: User,
    Message: Message
}