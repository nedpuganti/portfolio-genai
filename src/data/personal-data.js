const contactInfo = {
  phoneNumber: "(423) 902-8634",
  email: "itsmenarene@gmail.com",
  address: "N/A",
  website: "www.narenedpuganti.com",
};

function personalInfo(count) {
  return {
    summary: `I am a Full Stack Web Developer from Atlanta, USA. I am very passionate and dedicated to my work. I have ${count} years more work experience and enjoy working in a team or individual.`,
    firstName: "Naren",
    lastName: "Edpuganti",
    dob: "June 1991",
    nationality: "India",
    phoneNumber: "(423) 902-8634",
    email: "itsmenarene@gmail.com",
    address: "N/A",
    languages: "Telugu, English",
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
      name: "Happy Customers",
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
