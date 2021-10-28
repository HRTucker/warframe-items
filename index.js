/**
 * Configuration options for warframe-items
 * @typedef {Object} Options
 *
 * @property {string[]} category List of allowed categories to be pulled in.
 *                        Default ['All'].
 *                        Allows any of:
 *                         - All
 *                         - Arcanes
 *                         - Archwing
 *                         - Arch-Gun
 *                         - Arch-Melee
 *                         - Corpus
 *                         - Enemy
 *                         - Fish
 *                         - Gear
 *                         - Glyphs
 *                         - Melee
 *                         - Misc
 *                         - Mods
 *                         - Pets
 *                         - Primary
 *                         - Quests
 *                         - Relics
 *                         - Resources
 *                         - Secondary
 *                         - Sentinels
 *                         - Skins
 *                         - Warframes
 * @property {boolean} ignoreEnemies If true, don't load any enemy categories
 * @property {boolean|Array<string>} i18n Whether or not to include i18n, or a list of allowed locales
 * @property {boolean} i18nOnObject Whether or not to include i18n on the object itself and not on the "array"
 */

const versions = require('./data/cache/.export.json')
let i18n = {}
try {
  i18n = require('./data/json/i18n.json')
} catch (ignored) {
  // can only happen in really weird stuff, and we're already defaulting, so it's ok
}
const defaultOptions = { category: ['All'], i18n: false, i18nOnObject: false }

class Items extends Array {
  constructor (options, ...items) {
    super(...items)

    // Merge provided options with defaults
    this.options = {
      ...defaultOptions,
      ...options
    }

    this.i18n = {}

    // Add items from options to array. Type equals the file name.
    for (const category of this.options.category) {
      // Ignores the enemy category.
      if (this.options.ignoreEnemies && category === 'Enemy') continue
      const items = require(`./data/json/${category}.json`)
      for (const item of items) {
        if (this.options.i18n) {
          // only insert i18n for the objects we're inserting so we don't bloat memory
          if (Array.isArray(this.options.i18n)) {
            const raw = i18n[item.uniqueName]
            Object.keys(raw).forEach(locale => {
              if (!this.options.i18n.includes(locale)) {
                delete raw[locale]
              }
            })
            this.i18n[item.uniqueName] = raw
          } else {
            this.i18n[item.uniqueName] = i18n[item.uniqueName]
          }
        }
        if (this.options.i18n && this.options.i18nOnObject) {
          item.i18n = this.i18n[item.uniqueName]
          // keep data just on the object so no bloat in extra this.i18n
          delete this.i18n[item.uniqueName]
        }
        this.push(item)
      }
    }
    if (!this.options.i18n || (this.options.i18n && this.options.i18nOnObject)) {
      this.i18n = undefined
    }

    // Output won't be sorted if separate categories are chosen
    this.sort((a, b) => {
      const res = a.name.localeCompare(b.name)
      if (res === 0) {
        return a.uniqueName.localeCompare(b.uniqueName)
      } else {
        return res
      }
    })

    this.versions = versions
  }

  /**
   * Override Array.prototype.filter
   *
   * This roughly implements Mozilla's builtin for `Array.prototype.filter`[1].
   * V8 passes the prototype of the original Array into `ArraySpeciesCreate`[2][3],
   * which is the Array that gets returned from `filter()`. However, they don't
   * pass the arguments passed to the constructor of the original Array (this Class),
   * which means that it will always return a new Array with ALL items, even when
   * different categories are specified.[4]
   *
   * [1] https://hg.mozilla.org/mozilla-central/file/tip/js/src/builtin/Array.js#l320
   * [2] https://github.com/v8/v8/blob/master/src/builtins/array-filter.tq#L193
   * [3] https://www.ecma-international.org/ecma-262/7.0/#sec-arrayspeciescreate
   * [4] https://runkit.com/kaptard/5c9daf33090ab900120465fe
   */
  filter (fn) {
    const A = []

    for (const el of this) {
      if (fn(el)) A.push(el)
    }
    return A
  }
}

module.exports = Items
