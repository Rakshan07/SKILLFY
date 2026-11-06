const preset = (roles, skills, experience) => ({ roles, skills, experience });
export const registrationFields = {
  hackathon: preset(['Frontend developer','Backend developer','Designer','Project lead'], ['Web development','API development','UI design','Testing'], 'Projects or hackathons you have contributed to'),
  coding_competition: preset(['Algorithm solver','Debugger','Team strategist'], ['Algorithms','Data structures','Problem solving','Competitive programming'], 'Coding contests or problems you have worked on'),
  ai_coding: preset(['AI developer','Software engineer','AI evaluator'], ['AI-assisted development','Prompt design','Programming','Testing'], 'AI coding tools or projects you have used'),
  ai_ml: preset(['ML engineer','Data scientist','Data engineer','Researcher'], ['Machine learning','Data preparation','Model evaluation','Statistics'], 'Models, datasets or experiments you have worked on'),
  robotics: preset(['Mechanical designer','Electronics engineer','Robotics programmer','Control systems specialist'], ['Mechanical design','Sensors','Robot programming','Control systems'], 'Robots or hardware projects you have built'),
  iot: preset(['Embedded developer','Electronics designer','Connectivity specialist','App developer'], ['Microcontrollers','Sensors','Networking','Embedded programming'], 'Connected devices or embedded projects you have built'),
  technical_quiz: preset(['Subject specialist','Researcher','Team coordinator'], ['Technical knowledge','Logical reasoning','Recall','Team strategy'], 'Quiz topics and competitions you have experience with'),
  startup_pitch: preset(['Founder','Business strategist','Product designer','Presenter'], ['Market research','Business modelling','Pitching','Financial planning'], 'Business ideas, pitches or ventures you have worked on'),
  debate: preset(['Opening speaker','Rebuttal speaker','Closing speaker','Researcher'], ['Public speaking','Argument building','Rebuttal','Evidence research'], 'Debates, speeches or research you have prepared'),
  music: preset(['Vocalist','Guitarist','Keyboardist','Percussionist','Composer','Arranger','Audio producer'], ['Vocals','Guitar','Keyboard','Percussion','Composition','Music production'], 'Instruments, performances or compositions you have experience with'),
  esports: preset(['Team captain','In-game leader','Support player','Strategist','Flex player'], ['Team communication','Game strategy','Positioning','Game mechanics'], 'Game title, preferred position, rank and tournament experience'),
  web_development: preset(['Frontend developer','Backend developer','UX designer','QA tester'], ['HTML and CSS','JavaScript','APIs','Accessibility'], 'Websites or web applications you have built'),
  mobile_development: preset(['Mobile developer','Backend developer','App designer','QA tester'], ['Android','iOS','Cross-platform development','Mobile UI'], 'Mobile apps you have built or designed'),
  data_science: preset(['Data analyst','Data scientist','Data engineer','Visualisation specialist'], ['Statistics','Data cleaning','Visualisation','Predictive modelling'], 'Datasets, analyses or dashboards you have worked on'),
  cybersecurity: preset(['Security analyst','CTF solver','Network specialist','Incident responder'], ['Network security','Web security','Cryptography','Digital forensics'], 'Security labs, CTFs or authorized research you have completed'),
  project_exhibition: preset(['Project lead','Builder','Designer','Presenter'], ['Prototyping','Design','Documentation','Demonstration'], 'Projects or prototypes you have contributed to'),
  research_presentation: preset(['Researcher','Methodology lead','Data analyst','Presenter'], ['Literature review','Research methods','Analysis','Academic writing'], 'Research topics, papers or presentations you have worked on'),
  other: preset(['Contributor','Coordinator','Researcher','Presenter'], ['Planning','Research','Creative thinking','Communication'], 'Experience relevant to this event'),
};

export function getRegistrationFields(event) {
  return registrationFields[event.category_id || event.category] || registrationFields.other;
}

export function getTeamFields(event) {
  const category = event.category_id || event.category;
  const descriptions = {
    music: ['Musical direction (optional)', 'Describe your sound, repertoire and rehearsal plans.'],
    debate: ['Debate approach (optional)', 'Describe your preparation, research and speaking approach.'],
    esports: ['Squad description (optional)', 'Describe your game, play style, positions and practice schedule.'],
    technical_quiz: ['Quiz team focus (optional)', 'Describe your subject strengths and preparation plans.'],
    startup_pitch: ['Venture & pitch (optional)', 'Describe your idea, target audience and pitch preparation.'],
    research_presentation: ['Research focus (optional)', 'Describe your topic, research approach and presentation plans.'],
    robotics: ['Robot concept (optional)', 'Describe your robot, hardware and testing plans.'],
    iot: ['Connected-device concept (optional)', 'Describe your device, sensors and integration plans.'],
    ai_ml: ['AI project focus (optional)', 'Describe your problem, data and model approach.'],
    ai_coding: ['AI development focus (optional)', 'Describe what you plan to build and how your team will work.'],
    data_science: ['Analysis focus (optional)', 'Describe your data question, analysis and intended findings.'],
    cybersecurity: ['Security focus (optional)', 'Describe your security disciplines and collaboration approach.'],
    coding_competition: ['Contest approach (optional)', 'Describe your problem-solving strengths and practice plans.'],
    web_development: ['Web project concept (optional)', 'Describe your website, users and development approach.'],
    mobile_development: ['App concept (optional)', 'Describe your app, target platforms and development approach.'],
    project_exhibition: ['Exhibition concept (optional)', 'Describe your project, demonstration and presentation plans.'],
    hackathon: ['Project concept (optional)', 'Describe your idea and how the team will build it.'],
    other: ['Team description (optional)', 'Describe your goals and how you plan to work together.'],
  };
  const [descriptionLabel, descriptionHint] = descriptions[category] || descriptions.other;
  const roles = [...new Set([...(event.roles || []).map(r=>r.name).filter(name=>name && name.toLowerCase() !== 'contributor'), ...getRegistrationFields(event).roles])];
  return {roles, descriptionLabel, descriptionHint};
}
