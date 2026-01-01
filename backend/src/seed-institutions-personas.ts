import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Institution, InstitutionType } from './modules/institution/institution.entity';
import {
  Persona,
  FeedPreference,
  CredibilitySignal,
  EngagementStyle,
} from './modules/persona/persona.entity';
import { User, BadgeType } from './modules/user/user.entity';

async function seedInstitutionsAndPersonas() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const institutionRepository = dataSource.getRepository(Institution);
  const personaRepository = dataSource.getRepository(Persona);
  const userRepository = dataSource.getRepository(User);

  console.log('Creating institutions...\n');

  // Create institutions
  const institutions = [
    {
      name: 'Stanford University',
      slug: 'stanford',
      domains: ['stanford.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private research university in Stanford, California. Known for excellence in engineering, computer science, and entrepreneurship.',
      location: 'Stanford, CA',
      website: 'https://www.stanford.edu',
      logoUrl: 'https://identity.stanford.edu/wp-content/uploads/sites/3/2020/07/block-s-right.png',
      isVerified: true,
    },
    {
      name: 'Massachusetts Institute of Technology',
      slug: 'mit',
      domains: ['mit.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private research university in Cambridge, Massachusetts. World leader in science, technology, and innovation.',
      location: 'Cambridge, MA',
      website: 'https://www.mit.edu',
      logoUrl: 'https://web.mit.edu/graphicidentity/downloads/mit-logo-red-gray-72x38.png',
      isVerified: true,
    },
    {
      name: 'Harvard University',
      slug: 'harvard',
      domains: ['harvard.edu', 'harvardmed.edu', 'hms.harvard.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private Ivy League research university in Cambridge, Massachusetts. Oldest institution of higher education in the United States.',
      location: 'Cambridge, MA',
      website: 'https://www.harvard.edu',
      logoUrl: 'https://www.harvard.edu/wp-content/uploads/2021/02/harvard-logo.png',
      isVerified: true,
    },
    {
      name: 'Princeton University',
      slug: 'princeton',
      domains: ['princeton.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private Ivy League research university in Princeton, New Jersey. Renowned for undergraduate education and research in natural sciences.',
      location: 'Princeton, NJ',
      website: 'https://www.princeton.edu',
      logoUrl: 'https://communications.princeton.edu/sites/default/files/styles/half_2x/public/images/Princeton_shield.png',
      isVerified: true,
    },
    {
      name: 'Yale University',
      slug: 'yale',
      domains: ['yale.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private Ivy League research university in New Haven, Connecticut. Known for law, medicine, and liberal arts.',
      location: 'New Haven, CT',
      website: 'https://www.yale.edu',
      logoUrl: 'https://www.yale.edu/sites/default/files/favicon_0.ico',
      isVerified: true,
    },
    {
      name: 'California Institute of Technology',
      slug: 'caltech',
      domains: ['caltech.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private research university in Pasadena, California. Focuses on science and engineering research.',
      location: 'Pasadena, CA',
      website: 'https://www.caltech.edu',
      logoUrl: 'https://www.caltech.edu/favicon.ico',
      isVerified: true,
    },
    {
      name: 'University of Chicago',
      slug: 'uchicago',
      domains: ['uchicago.edu'],
      type: InstitutionType.UNIVERSITY,
      description:
        'Private research university in Chicago, Illinois. Known for economics, sociology, and social sciences.',
      location: 'Chicago, IL',
      website: 'https://www.uchicago.edu',
      logoUrl: 'https://www.uchicago.edu/favicon.ico',
      isVerified: true,
    },
    {
      name: 'National Institutes of Health',
      slug: 'nih',
      domains: ['nih.gov'],
      type: InstitutionType.GOVERNMENT,
      description:
        'Primary agency of the United States government responsible for biomedical and public health research.',
      location: 'Bethesda, MD',
      website: 'https://www.nih.gov',
      logoUrl: 'https://www.nih.gov/sites/default/files/favicon.ico',
      isVerified: true,
    },
    {
      name: 'National Science Foundation',
      slug: 'nsf',
      domains: ['nsf.gov'],
      type: InstitutionType.GOVERNMENT,
      description:
        'United States government agency that supports fundamental research and education in non-medical fields of science and engineering.',
      location: 'Alexandria, VA',
      website: 'https://www.nsf.gov',
      logoUrl: 'https://www.nsf.gov/favicon.ico',
      isVerified: true,
    },
    {
      name: 'Allen Institute',
      slug: 'allen-institute',
      domains: ['alleninstitute.org'],
      type: InstitutionType.RESEARCH_INSTITUTE,
      description:
        'Independent, nonprofit research institute dedicated to understanding the fundamental principles of brain function.',
      location: 'Seattle, WA',
      website: 'https://alleninstitute.org',
      logoUrl: 'https://alleninstitute.org/favicon.ico',
      isVerified: true,
    },
  ];

  const createdInstitutions: Institution[] = [];
  for (const instData of institutions) {
    try {
      let institution = await institutionRepository.findOne({
        where: { slug: instData.slug },
      });
      if (institution) {
        console.log(`Institution ${instData.name} already exists, skipping...`);
        createdInstitutions.push(institution);
      } else {
        institution = institutionRepository.create(instData);
        await institutionRepository.save(institution);
        createdInstitutions.push(institution);
        console.log(`✓ Created institution: ${instData.name}`);
      }
    } catch (error) {
      console.error(`Error creating institution ${instData.name}:`, error.message);
    }
  }

  console.log('\nCreating personas...\n');

  // Create personas
  const personas = [
    {
      name: 'University Student',
      slug: 'student',
      description:
        'Undergraduate or graduate student pursuing academic studies. Values learning, exploring new topics, and connecting with peers.',
      preferredFields: [
        'Computer Science',
        'Biology',
        'Physics',
        'Chemistry',
        'Engineering',
      ],
      feedPreferences: [
        FeedPreference.TOPIC_FEEDS,
        FeedPreference.HOME_FEED,
        FeedPreference.TRENDING,
      ],
      credibilitySignals: [
        CredibilitySignal.OPEN_ACCESS,
        CredibilitySignal.CITATION_COUNTS,
        CredibilitySignal.PEER_REVIEWS,
      ],
      engagementStyle: EngagementStyle.DISCUSSION_DRIVEN,
      coldStartDefaults: {
        topics: ['machine-learning', 'quantum-computing', 'neuroscience'],
        journals: ['nature', 'science'],
        sortBy: 'trending',
      },
    },
    {
      name: 'Academic Researcher',
      slug: 'researcher',
      description:
        'Faculty, postdoc, or research scientist conducting original research. Focused on staying current with cutting-edge developments in their field.',
      preferredFields: [
        'Artificial Intelligence',
        'Quantum Computing',
        'Neuroscience',
        'Climate Science',
      ],
      feedPreferences: [
        FeedPreference.JOURNAL_FEEDS,
        FeedPreference.AUTHOR_FEEDS,
        FeedPreference.TOPIC_FEEDS,
      ],
      credibilitySignals: [
        CredibilitySignal.IMPACT_FACTOR,
        CredibilitySignal.CITATION_COUNTS,
        CredibilitySignal.INSTITUTIONAL_AFFILIATION,
      ],
      engagementStyle: EngagementStyle.CURATOR,
      coldStartDefaults: {
        topics: ['artificial-intelligence', 'quantum-computing', 'neuroscience'],
        journals: ['nature', 'science', 'cell'],
        sortBy: 'impact_factor',
      },
    },
    {
      name: 'SME Professional',
      slug: 'sme',
      description:
        'Industry professional or subject matter expert applying research to real-world problems. Interested in practical applications and cross-disciplinary insights.',
      preferredFields: [
        'Applied AI',
        'Biotechnology',
        'Green Chemistry',
        'Materials Science',
      ],
      feedPreferences: [
        FeedPreference.TOPIC_FEEDS,
        FeedPreference.INSTITUTIONAL,
        FeedPreference.TRENDING,
      ],
      credibilitySignals: [
        CredibilitySignal.INSTITUTIONAL_AFFILIATION,
        CredibilitySignal.CITATION_COUNTS,
        CredibilitySignal.OPEN_ACCESS,
      ],
      engagementStyle: EngagementStyle.ACTIVE_SHARER,
      coldStartDefaults: {
        topics: ['machine-learning', 'biotechnology', 'green-chemistry'],
        journals: ['nature-biotechnology', 'applied-physics-letters'],
        sortBy: 'recent',
      },
    },
    {
      name: 'Public Learner',
      slug: 'public-learner',
      description:
        'Science enthusiast or citizen scientist passionate about understanding the world. Values accessible explanations and broad scientific literacy.',
      preferredFields: [
        'Popular Science',
        'Space Exploration',
        'Health & Medicine',
        'Environmental Science',
      ],
      feedPreferences: [
        FeedPreference.HOME_FEED,
        FeedPreference.TRENDING,
        FeedPreference.TOPIC_FEEDS,
      ],
      credibilitySignals: [
        CredibilitySignal.OPEN_ACCESS,
        CredibilitySignal.PEER_REVIEWS,
        CredibilitySignal.CITATION_COUNTS,
      ],
      engagementStyle: EngagementStyle.CONTENT_CONSUMER,
      coldStartDefaults: {
        topics: ['space-exploration', 'climate-science', 'neuroscience'],
        journals: ['scientific-american', 'nature'],
        sortBy: 'trending',
      },
    },
  ];

  const createdPersonas: Persona[] = [];
  for (const personaData of personas) {
    try {
      let persona = await personaRepository.findOne({
        where: { slug: personaData.slug },
      });
      if (persona) {
        console.log(`Persona ${personaData.name} already exists, skipping...`);
        createdPersonas.push(persona);
      } else {
        persona = personaRepository.create(personaData);
        await personaRepository.save(persona);
        createdPersonas.push(persona);
        console.log(`✓ Created persona: ${personaData.name}`);
      }
    } catch (error) {
      console.error(`Error creating persona ${personaData.name}:`, error.message);
    }
  }

  console.log('\nUpdating existing demo users with institutions and personas...\n');

  // Mapping of email domains to institutions and personas
  const domainToInstitution = {
    'stanford.edu': createdInstitutions.find((i) => i.slug === 'stanford'),
    'mit.edu': createdInstitutions.find((i) => i.slug === 'mit'),
    'harvardmed.edu': createdInstitutions.find((i) => i.slug === 'harvard'),
    'princeton.edu': createdInstitutions.find((i) => i.slug === 'princeton'),
    'yale.edu': createdInstitutions.find((i) => i.slug === 'yale'),
    'caltech.edu': createdInstitutions.find((i) => i.slug === 'caltech'),
    'uchicago.edu': createdInstitutions.find((i) => i.slug === 'uchicago'),
  };

  const researcherPersona = createdPersonas.find((p) => p.slug === 'researcher');
  const studentPersona = createdPersonas.find((p) => p.slug === 'student');

  // Update all users
  const allUsers = await userRepository.find();
  for (const user of allUsers) {
    try {
      const emailDomain = user.email.split('@')[1];
      const institution = domainToInstitution[emailDomain];

      if (institution) {
        user.institution = institution;
        user.institutionId = institution.id;
        user.isInstitutionVerified = true;
        user.badgeType = BadgeType.UNIVERSITY_FACULTY;
        user.persona = researcherPersona;
        user.personaId = researcherPersona.id;

        await userRepository.save(user);
        console.log(`✓ Updated user ${user.username} with ${institution.name} and researcher persona`);

        // Update institution's verified user count
        institution.verifiedUserCount += 1;
        await institutionRepository.save(institution);
      }
    } catch (error) {
      console.error(`Error updating user ${user.username}:`, error.message);
    }
  }

  console.log('\n✅ Institutions and personas seeding complete!');
  console.log(`\nCreated ${createdInstitutions.length} institutions`);
  console.log(`Created ${createdPersonas.length} personas`);
  console.log(`Updated ${allUsers.length} users with institutional affiliations`);

  await app.close();
}

seedInstitutionsAndPersonas()
  .then(() => {
    console.log('\nDone ✓');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding institutions and personas:', error);
    process.exit(1);
  });
