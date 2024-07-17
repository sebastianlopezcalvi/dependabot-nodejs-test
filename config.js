module.exports = {
  labels: ["dependencies"],
  hostRules: [
    {
      hostType: 'maven',
      matchHost: 'gitlab.com',
      token: process.env.RENOVATE_TOKEN,
    }
  ],
  includeForks: true,
  platformAutomerge: false,
  packageRules: [
    {
      "description": "Auto merge small changes as per https://docs.renovatebot.com/configuration-options/#automerge",
      "matchUpdateTypes": ["patch", "pin", "digest"],
      "automerge": true
    }
  ]
};