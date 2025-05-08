
const mongoose = require('mongoose');

// Definir o esquema para o Email
const emailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});

// Criar o modelo baseado no esquema
const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
