const mongoose = require('mongoose')

let conn
const defineSchema = config => {
  const conn = require('../services/database')(config)

  const helpListingSchema = new mongoose.Schema({
    /**
    * Help listing document schema.
    */

    // TODO: validations; e.g., empty/require fields

    listingId: { // alphanum char string to ID listing; generated on save
      type: String,
      index: true,
      unique: true
    },
    botNick: String,
    serverHostname: String,
    helpPrefix: String,
    // Help entries
    modules: [{
      _id: false,
      moduleName: String,
      entries: [{
        _id: false,
        commands: { type: [String] }, // Command(s)
        doc: String, // Command doc/purpose
        examples: { type: [String] } // Command example(s)
      }]
    }]
  })

  const CHARACTER_SPACE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  helpListingSchema.statics.genRandomId = function (length = 4) {
    let result = []
    while (result.length < length) {
      result.push(CHARACTER_SPACE.charAt(Math.floor(Math.random() * CHARACTER_SPACE.length)))
    }

    return result.join('')
  }

  helpListingSchema.pre('save', async function (cb) {
    let collisionRetriesRemaining = 10 // Number of times to try to get a unique listingId
    let newListingId

    while (collisionRetriesRemaining-- > 0) {
      newListingId = this.constructor.genRandomId()

      if (!(await this.constructor.findOne({ listingId: newListingId }))) {
        this.listingId = newListingId
        cb()
      }
    }
    // Was not able to generate unique listing ID
    cb(Error('Could not generate unique listing ID.'))
  })

  return conn.model('HelpListing', helpListingSchema)
}

let instance
module.exports = config => {
  if (instance && conn.models.HelpListing) { return instance }
  instance = defineSchema(config)
  return instance
}
