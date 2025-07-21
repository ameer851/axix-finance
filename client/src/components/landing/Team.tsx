import React from 'react';
import { Link } from 'wouter';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Import team member images
import ceoImage from '@/assets/images/chief executive officer.png';
import cioImage from '@/assets/images/chief investment officer.png';
import techHeadImage from '@/assets/images/Head of Technology.png';
import dianaImage from '@/assets/images/Diana olsen.png';

const Team: React.FC = () => {
  const teamMembers = [
    {
      name: "Elon Musk",
      role: "Chief Executive Officer",
      bio: "Alex has over 15 years of experience in financial technology and investment management, leading Axix Finance to become a premier digital investment platform.",
      initials: "AJ",
      image: ceoImage,
      socialLinks: {
        linkedin: "https://linkedin.com/in/",
        twitter: "https://twitter.com/",
        email: "alex@axix-finance.co"
      }
    },
    {
      name: "Sarah Chen",
      role: "Chief Investment Officer",
      bio: "With a background in quantitative finance and a decade at top hedge funds, Sarah oversees our investment strategies and ensures optimal portfolio performance.",
      initials: "SC",
      image: cioImage,
      socialLinks: {
        linkedin: "https://linkedin.com/in/",
        twitter: "https://twitter.com/",
        email: "sarah@axix-finance.co"
      }
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Technology",
      bio: "Michael brings 12 years of experience in fintech and blockchain development, ensuring our platform remains secure, innovative, and user-friendly.",
      initials: "MR",
      image: techHeadImage,
      socialLinks: {
        linkedin: "https://linkedin.com/in/",
        twitter: "https://twitter.com/",
        email: "michael@axix-finance.co"
      }
    },
    {
      name: "Diana Olsen",
      role: "Customer Success Director",
      bio: "Diana leads our support team with a focus on exceptional service. Her financial advisory background helps clients optimize their portfolios and achieve their goals.",
      initials: "DO",
      image: dianaImage,
      socialLinks: {
        linkedin: "https://linkedin.com/in/",
        twitter: "https://twitter.com/",
        email: "diana@axix-finance.co"
      }
    }
  ];

  return (
    <section id="team" className="py-16 bg-white dark:bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-secondary dark:text-white sm:text-4xl">
            Meet Our Team
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our diverse team of experts is dedicated to maximizing your investment returns and providing exceptional service.
          </p>
        </div>        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-accent dark:bg-accent/20 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col items-center mb-3 sm:mb-4">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary mb-3 sm:mb-4">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg sm:text-xl font-bold text-secondary dark:text-white text-center">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mt-1 text-center">{member.role}</p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base mb-4">
                  {member.bio}
                </p>                <div className="flex justify-center space-x-4">
                  <a href={member.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                     className="text-gray-500 hover:text-primary" aria-label={`${member.name}'s LinkedIn profile`} title={`${member.name}'s LinkedIn profile`}>
                    <Linkedin className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <a href={member.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                     className="text-gray-500 hover:text-primary" aria-label={`${member.name}'s Twitter profile`} title={`${member.name}'s Twitter profile`}>
                    <Twitter className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <a href={`mailto:${member.socialLinks.email}`}
                     className="text-gray-500 hover:text-primary" aria-label={`Email ${member.name}`} title={`Email ${member.name}`}>
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
          <div className="mt-10 sm:mt-12 text-center">
          <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base max-w-3xl mx-auto mb-5 sm:mb-6 px-4">
            Our team combines expertise in finance, technology, and customer service to deliver exceptional investment experiences.
          </p>          
          <Link href="/register" className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90">
            Start Investing With Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Team;