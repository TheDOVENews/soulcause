/* SoulCause content: verses (KJV, public domain), pages and prayer lines. */
window.SC_CONTENT = {
  verses: {
    home:  { dest: 'HOME',  color: '#F5C518', ref: 'Matthew 4:19 (KJV)', text: 'Follow me, and I will make you fishers of men.' },
    send:  { dest: 'SEND',  color: '#6E8CFF', ref: 'Matthew 10:7 (KJV)', text: 'And as ye go, preach, saying, The kingdom of heaven is at hand.' },
    labor: { dest: 'LABOR', color: '#F2711C', ref: 'Luke 10:2 (KJV)', text: 'The harvest truly is great, but the labourers are few: pray ye therefore the Lord of the harvest, that he would send forth labourers into his harvest.' },
    obedience: { dest: 'OBEDIENCE', color: '#B9A6F0', ref: 'Matthew 28:19–20 (KJV)', text: 'Go ye therefore, and teach all nations… teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world.' },
    unreached: { dest: 'UNREACHED', color: '#1E9E5A', ref: 'Romans 15:20 (KJV)', text: 'Yea, so have I strived to preach the gospel, not where Christ was named, lest I should build upon another man\'s foundation.' }
  },
  nav: [['home','HOME','#0B0B0C'],['send','SEND','#1F4FD8'],['obedience','OBEDIENCE','#B9A6F0'],['unreached','UNREACHED','#1E9E5A'],['labor','LABOR','#F2711C']],
  alias: { reach: 'unreached', net: 'obedience', field: 'obedience' },
  fruit: [['Love','#F2711C'],['Joy','#F5C518'],['Peace','#1F4FD8'],['Longsuffering','#1E9E5A'],['Gentleness','#B9A6F0'],['Goodness','#B9A6F0'],['Faith','#F2711C'],['Meekness','#1E9E5A'],['Temperance','#F5C518']],
  pages: {
    send: { name: 'SEND', tier: 'THE 12 · MATTHEW 10', color: '#1F4FD8', ink: '#FFFFFF',
      letters: [['S','Select'],['E','Equip'],['N','Nurture'],['D','Deploy']],
      lead: 'For the core team inside one church. Begin with a sending assessment, agree on a 90-day plan and send your first twelve.',
      cards: [['Sending assessment','See where your church stands on evangelism today, in plain language.'],['90-day sending plan','A plan your leaders review and agree on before anyone is sent.'],['Coach check-ins','A SoulCause adviser walks with your twelve through the first season.']],
      price: '$49 / month', cta: 'Walk in OBEDIENCE →', next: 'obedience' },
    labor: { name: 'LABOR', tier: 'THE 70 · LUKE 10', color: '#F2711C', ink: '#0B0B0C',
      letters: [['L','Lead'],['A','Assign'],['B','Build'],['O','Organize'],['R','Report']],
      lead: 'For churches and networks training labourers and sending them two by two into every place.',
      cards: [['Two-by-two teams','Pair and assign teams, each with an owner and a field.'],['Trainer toolkit','Original and licensed training your leaders can teach again.'],['Cohort follow-through','Every commitment tracked until it is done.']],
      price: '$49 / month', cta: 'Back to SEND →', next: 'send' },
    obedience: { name: 'OBEDIENCE', tier: 'TEACHING THEM TO OBSERVE · MATTHEW 28:20', color: '#B9A6F0', ink: '#0B0B0C',
      letters: [['N','Networks'],['E','Events'],['T','Training'],['F','FIELD']],
      lead: 'We go because He said go. OBEDIENCE brings our NET services (networks, events and training) and the FIELD app together, so a plan becomes faithful, measured follow-through.',
      cards: [['Print','Guides, tracts and training workbooks.'],['In person','Workshops, retreats and sending services.'],['Virtual','Live cohorts and on-demand coaching.'],['Outsourced','SoulCause partners run the program alongside you.'],['FIELD app · in development','Assess, plan, act and report in one place. $12 / month when it launches.'],['Faithfulness measures','Conversations, people trained, teams sent. Never a scoreboard of souls.']],
      price: 'NET services from $150 · FIELD $12 / month', cta: 'Reach the UNREACHED →', next: 'unreached' },
    unreached: { name: 'UNREACHED', tier: 'THE WORLD · ROMANS 15:20', color: '#1E9E5A', ink: '#0B0B0C',
      letters: [['R','Resource'],['E','Equip'],['A','Activate'],['C','Connect'],['H','Harvest']],
      lead: 'For denominations, networks and ministries carrying the Great Commission to the people groups still waiting to hear. Includes REACH, our network plan.',
      cards: [['Harvest field explorer','Region by region: people, unreached groups and workers needed (Joshua Project).'],['Adviser portal','Consultants see only what each church has chosen to share.'],['Licensed playbooks','Proven sending pathways, adapted to your tradition.'],['Network reporting','One view of faithfulness across every church you serve.']],
      price: 'Starting at $150', cta: 'Send labourers with LABOR →', next: 'labor' }
  },
  regions: {
    asOf: 'Joshua Project, retrieved November 2026',
    source: 'https://joshuaproject.net/global/continents',
    data: {
      na: { pop: 617481000, groups: 1416, upg: 184, upgPop: 18331000, upgPct: 3.0, evang: 21.4, workers: 445, verse: 'Ye are the light of the world. A city that is set on an hill cannot be hid.', ref: 'Matthew 5:14' },
      sa: { pop: 438310000, groups: 907, upg: 110, upgPop: 1747000, upgPct: 0.4, evang: 18.9, workers: 125, verse: 'How beautiful are the feet of them that preach the gospel of peace.', ref: 'Romans 10:15' },
      eu: { pop: 604037000, groups: 1551, upg: 455, upgPop: 31110000, upgPct: 5.2, evang: 2.9, workers: 876, verse: 'Come over into Macedonia, and help us.', ref: 'Acts 16:9' },
      af: { pop: 1574646000, groups: 3632, upg: 984, upgPop: 537066000, upgPct: 34.1, evang: 15.8, workers: 11070, verse: 'Ethiopia shall soon stretch out her hands unto God.', ref: 'Psalm 68:31' },
      as: { pop: 4957497000, groups: 7374, upg: 5351, upgPop: 3047733000, upgPct: 61.5, evang: 3.1, workers: 63159, verse: 'From the rising of the sun even unto the going down of the same my name shall be great among the Gentiles.', ref: 'Malachi 1:11' },
      oc: { pop: 46626000, groups: 1539, upg: 79, upgPop: 2270000, upgPct: 4.9, evang: 17.2, workers: 93, verse: 'He shall have dominion also from sea to sea, and from the river unto the ends of the earth.', ref: 'Psalm 72:8', note: 'Australia and Oceania combined' }
    }
  },
  focus: {
    pray: { label: 'Pray', color: '#B9A6F0', cta: 'Pray and train with OBEDIENCE →', go: 'obedience', line: 'Intercede for the people of {region} by name.' },
    go:   { label: 'Go', color: '#F2711C', cta: 'Train to go with LABOR →', go: 'labor', line: 'Be sent two by two into {region}.' },
    send: { label: 'Send', color: '#1F4FD8', cta: 'Send your first 12 with SEND →', go: 'send', line: 'Equip a team in your church to reach {region}.' },
    give: { label: 'Give', color: '#1E9E5A', cta: 'Partner through UNREACHED →', go: 'unreached', line: 'Resource the workers already serving in {region}.' }
  },
  roleLines: {
    pastor: 'Strengthen them as they shepherd Your people and send them out.',
    member: 'Make them bold and kind as a witness where they live and work.',
    ministry: 'Give wisdom to the work they serve and multiply its reach.',
    exploring: 'Draw them close and show them how deeply You love them.'
  }
};
