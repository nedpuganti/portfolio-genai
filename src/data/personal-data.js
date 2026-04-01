const contactInfo = {
  phoneNumber: "(423) 902-8634",
  email: "itsmenarene@gmail.com",
  website: "www.narenedpuganti.com",
  address: "Atlanta, USA",
  location: "Atlanta, USA",
};

function personalInfo(count) {
  return {
    fullName: "Naren Edpuganti",
    firstName: "Naren",
    lastName: "Edpuganti",
    dob: "June 1991",
    nationality: "India",
    languages: ["Telugu", "English"],
    professional: {
      role: "Platform Engineering and Full-Stack Product Developer",
      availability:
        "Available for frontend, platform UI, and product engineering opportunities.",
    },
    bios: {
      summary: `I am a Full Stack Web Developer from Atlanta, USA. I am very passionate and dedicated to my work. I have ${count}+ years more work experience and enjoy working in a team or individual.`,
      short: `Frontend and product engineer with ${count}+ years building Angular apps, dashboards, portals, and mobile experiences.`,
      long: "I build interfaces that feel polished for users and dependable for the teams behind them, staying close to API integration, release workflows, and the platform systems that keep products moving.",
    },
    socials: [
      {
        label: "GitHub",
        url: "https://github.com/nedpuganti",
        iconLabel: "GH",
      },
      // {
      //   label: "Instagram",
      //   url: "https://www.instagram.com/itsmenarene/",
      //   iconLabel: "IG",
      // },
    ],
  };
}

function funFacts(count) {
  return [
    {
      name: "Years Experience",
      value: count,
    },
    {
      name: "Projects Completed",
      value: 25,
    },
    {
      name: "Happy Clients",
      value: 15,
    },
    {
      name: "Awards Won",
      value: 5,
    },
  ];
}

module.exports = {
  contactInfo,
  personalInfo,
  funFacts,
};
