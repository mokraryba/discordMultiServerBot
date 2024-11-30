import mongoose from 'mongoose';

const GuildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  discordAdminId: { type: String, required: false },
  features: {
    gambling: { type: Boolean, default: true },
    economy: { type: Boolean, default: true },
  },
  adminRoles: [String],
  licenseKey: { type: String, required: false },
  created: { type: Date, default: Date.now },
  validUntil: { type: Date },
});

export default mongoose.model('GuildSettings', GuildSettingsSchema);
