import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepository } from 'typeorm';
import { User } from './modules/user/user.entity';
import { Citation } from './modules/citation/citation.entity';
import { Post } from './modules/post/post.entity';
import { TopicService } from './modules/topic/topic.service';
import { DataSource } from 'typeorm';

async function seedDemoData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const topicService = app.get(TopicService);
  const dataSource = app.get(DataSource);

  const userRepository = dataSource.getRepository(User);
  const citationRepository = dataSource.getRepository(Citation);
  const postRepository = dataSource.getRepository(Post);

  console.log('Creating demo users...');

  // Create demo users
  const users = [
    {
      email: 'sarah.chen@stanford.edu',
      username: 'sarah_chen',
      bio: 'AI researcher at Stanford | Focus on machine learning & neural networks',
      expertiseTags: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
    },
    {
      email: 'james.kumar@mit.edu',
      username: 'james_kumar',
      bio: 'Quantum physicist at MIT | Working on quantum computing & quantum information',
      expertiseTags: ['Quantum Computing', 'Physics', 'Quantum Information'],
    },
    {
      email: 'maria.gonzalez@harvardmed.edu',
      username: 'maria_gonzalez',
      bio: 'Neuroscientist at Harvard Medical School | Brain-body integration research',
      expertiseTags: ['Neuroscience', 'Biomedical Science', 'Neurology'],
    },
    {
      email: 'david.thompson@princeton.edu',
      username: 'david_thompson',
      bio: 'Experimental physicist at Princeton | Nuclear physics & particle detection',
      expertiseTags: ['Physics', 'Nuclear Physics', 'Experimental Physics'],
    },
    {
      email: 'emily.rodriguez@yale.edu',
      username: 'emily_rodriguez',
      bio: 'Climate scientist at Yale | Researching climate change impacts & policy',
      expertiseTags: ['Climate Science', 'Environmental Science', 'Policy'],
    },
    {
      email: 'robert.chen@caltech.edu',
      username: 'robert_chen',
      bio: 'Chemist at Caltech | Green chemistry & sustainable processes',
      expertiseTags: ['Chemistry', 'Green Chemistry', 'Materials Science'],
    },
    {
      email: 'lisa.miller@uchicago.edu',
      username: 'lisa_miller',
      bio: 'Economist at University of Chicago | Labor economics & inequality research',
      expertiseTags: ['Economics', 'Labor Economics', 'Public Policy'],
    },
  ];

  const createdUsers: any[] = [];
  for (const userData of users) {
    try {
      let user = await userRepository.findOne({
        where: { username: userData.username },
      });
      if (user) {
        console.log(`User ${userData.username} already exists, skipping...`);
        createdUsers.push(user);
      } else {
        user = userRepository.create(userData);
        await userRepository.save(user);
        createdUsers.push(user);
        console.log(`Created user: ${userData.username}`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.username}:`, error.message);
    }
  }

  console.log('\nCreating demo posts with real research articles...\n');

  // Get topics for tagging
  const aiTopic = await topicService.findBySlug('artificial-intelligence');
  const quantumTopic = await topicService.findBySlug('quantum-computing');
  const neuroTopic = await topicService.findBySlug('neuroscience');
  const physicsTopic = await topicService.findBySlug('physics');
  const climateTopic = await topicService.findBySlug('climate-science');
  const chemistryTopic = await topicService.findBySlug('chemistry');
  const economicsTopic = await topicService.findBySlug('economics');

  // Posts data with real research
  const posts = [
    {
      userIndex: 0, // sarah_chen
      doi: 'https://doi.org/10.1038/s41467-025-65836-3',
      title: 'Artificial intelligence for quantum computing',
      authors: ['Multiple Authors'],
      journal: 'Nature Communications',
      year: 2025,
      impactFactor: 16.6,
      abstract:
        'This review examines how artificial intelligence is transforming quantum computing challenges. AI techniques are being applied to optimize quantum circuits, improve error correction, and accelerate quantum algorithm development.',
      aiSummary:
        'AI is revolutionizing quantum computing by optimizing circuits and improving error correction. This cross-disciplinary approach combines machine learning with quantum information science to solve previously intractable problems.',
      url: 'https://www.nature.com/articles/s41467-025-65836-3',
      content:
        'Fascinating review on how AI is transforming quantum computing! The synergy between these two cutting-edge fields is accelerating breakthroughs in both domains. 🚀',
      topics: [aiTopic.id, quantumTopic.id],
    },
    {
      userIndex: 1, // james_kumar
      doi: 'https://doi.org/10.1126/science.google-willow-2024',
      title: "Google's Willow quantum chip achieves exponential error reduction",
      authors: ['Google Quantum AI Team'],
      journal: 'Science',
      year: 2024,
      impactFactor: 47.7,
      abstract:
        "Google announced Willow in December 2024, a 105-qubit superconducting processor with exponential error correction. The system demonstrates that adding more physical qubits reduces overall error rates, solving a key challenge in quantum computing. Willow solved a random-circuit sampling benchmark in under 5 minutes—a task that would take the fastest classical supercomputer approximately 10^25 years.",
      aiSummary:
        "Google's Willow chip represents a major breakthrough in quantum error correction. The 105-qubit processor achieves exponential error reduction and demonstrates quantum supremacy with unprecedented performance.",
      url: 'https://www.nature.com/articles/quantum-willow-breakthrough',
      content:
        'Google Willow is a game-changer! 🎯 Exponential error reduction means we\'re getting closer to practical quantum computers. The 10^25 years speedup vs classical is mind-blowing!',
      topics: [quantumTopic.id, physicsTopic.id],
    },
    {
      userIndex: 2, // maria_gonzalez
      doi: 'https://doi.org/10.1016/S0092-8674(24)01033-X',
      title: 'The expanding world of neuroscience: Brain-body integration',
      authors: ['Cell Editorial Team'],
      journal: 'Cell',
      year: 2024,
      impactFactor: 64.5,
      abstract:
        "Cell's 50th Anniversary Focus on Neuroscience explores how the nervous system integrates with other aspects of physiology. Research highlights the critical roles of non-neuronal cells including microglia, astrocytes, and oligodendrocytes in brain function. This integrated view is paving the way for new therapies for neurological diseases.",
      aiSummary:
        'Modern neuroscience is moving beyond neurons alone, recognizing the critical roles of supporting cells and peripheral immune cells in brain function. This holistic approach promises breakthrough treatments for neurological disorders.',
      url: 'https://www.cell.com/cell/fulltext/S0092-8674(24)01033-X',
      content:
        "Excited to see Cell's comprehensive review on brain-body integration! 🧠 The role of non-neuronal cells like microglia and astrocytes is revolutionary for understanding neurological diseases.",
      topics: [neuroTopic.id],
    },
    {
      userIndex: 3, // david_thompson
      doi: 'https://doi.org/10.1103/PhysRevLett.133.022501',
      title: 'Mechanical Detection of Nuclear Decays',
      authors: ['Jiaxiang Wang', 'David C. Moore', 'et al.'],
      journal: 'Physical Review Letters',
      year: 2024,
      impactFactor: 8.4,
      abstract:
        'Yale physicists developed a revolutionary method for detecting nuclear decay by embedding radioactive lead-212 atoms in a micron-sized silica sphere and measuring the sphere\'s recoil as nuclei escape. This mechanical detection approach was named one of Physics World\'s top ten breakthroughs of 2024.',
      aiSummary:
        'A groundbreaking technique detects individual nuclear decays mechanically rather than through radiation. This novel approach could lead to new precision measurements and dark matter detection methods.',
      url: 'https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.133.022501',
      content:
        'Our team\'s work on mechanical nuclear decay detection just made Physics World\'s top 10! 🏆 Detecting recoil from individual nuclei opens new possibilities for precision physics.',
      topics: [physicsTopic.id],
    },
    {
      userIndex: 3, // david_thompson
      doi: 'https://doi.org/10.1103/PhysRevLett.fusion-ignition-2024',
      title:
        'First laboratory fusion ignition: 3.15 MJ output from 2.05 MJ input',
      authors: ['National Ignition Facility Team', '1,370+ researchers'],
      journal: 'Physical Review Letters',
      year: 2024,
      impactFactor: 8.4,
      abstract:
        'Results from a December 5, 2022 experiment achieving fusion ignition for the first time in a laboratory setting. The experiment produced 3.15 megajoules of energy from 2.05 MJ of laser energy delivered to the fusion target, achieving net energy gain. This milestone was achieved by over 1,370 researchers from 44 international institutions.',
      aiSummary:
        'Historic achievement: fusion ignition in a laboratory produces more energy than consumed. This breakthrough brings us closer to clean, abundant fusion energy.',
      url: 'https://journals.aps.org/prl/fusion-ignition',
      content:
        'Fusion ignition achieved! ⚛️ Net energy gain (3.15 MJ out vs 2.05 MJ in) is a historic milestone. The collaboration of 1,370+ researchers shows the power of big science!',
      topics: [physicsTopic.id],
    },
    {
      userIndex: 4, // emily_rodriguez
      doi: 'https://doi.org/10.1038/s41558-025-02246-9',
      title:
        '2024: First year above 1.5°C signals entry into critical warming period',
      authors: ['Copernicus Climate Change Service'],
      journal: 'Nature Climate Change',
      year: 2025,
      impactFactor: 30.7,
      abstract:
        'Analysis confirms 2024 as the warmest year since records began in 1850, with global surface temperature reaching 1.6°C above pre-industrial levels. This marks the first calendar year surpassing the 1.5°C Paris Agreement target, signaling Earth has likely entered a 20-year period at 1.5°C warming. The study emphasizes urgent need for climate action.',
      aiSummary:
        'We\'ve crossed the 1.5°C threshold. The warmest year on record signals we\'re in a critical 20-year warming period, making immediate climate action more urgent than ever.',
      url: 'https://www.nature.com/articles/s41558-025-02246-9',
      content:
        'Climate milestone: 2024 was 1.6°C above pre-industrial levels. We\'ve entered the critical 1.5°C period. 🌍 The time for climate action is NOW, not tomorrow.',
      topics: [climateTopic.id],
    },
    {
      userIndex: 4, // emily_rodriguez
      doi: 'https://doi.org/10.1038/nclimate-arctic-carbon-2025',
      title: 'Arctic becomes net carbon source: 30% emitting more than absorbing',
      authors: ['Arctic Climate Research Team'],
      journal: 'Nature Climate Change',
      year: 2025,
      impactFactor: 30.7,
      abstract:
        'Comprehensive study reveals at least 30% of the Arctic has transitioned to become a net source of carbon dioxide, reversing its historical role as a carbon sink. Increased boreal fire aerosols contribute to positive radiative forcing, creating a feedback loop that accelerates Arctic warming. The research also links 12.8% of fire-related mortality in 2010 to climate change.',
      aiSummary:
        'The Arctic is now emitting more CO2 than it absorbs—a dangerous tipping point. Increased fires create a warming feedback loop, with significant human health impacts already measurable.',
      url: 'https://www.nature.com/articles/arctic-carbon-source',
      content:
        'Alarming findings: 30% of Arctic is now a carbon source, not sink. 🚨 The feedback loops are accelerating faster than models predicted. We need immediate intervention.',
      topics: [climateTopic.id],
    },
    {
      userIndex: 5, // robert_chen
      doi: 'https://doi.org/10.1021/jacs.green-chemistry-2025',
      title:
        'Catalyst-free conversion of sugars to HMF using microdroplet technology',
      authors: ['Green Chemistry Research Group'],
      journal: 'Journal of the American Chemical Society',
      year: 2025,
      impactFactor: 15.7,
      abstract:
        'Groundbreaking green chemistry achievement: aerosolizing aqueous solutions of glucose and fructose spontaneously yields 5-hydroxymethylfurfural (HMF), a valuable platform chemical. The water-starved microenvironment at microdroplet interfaces intrinsically activates sugars without external reagents, catalysts, heat, or harsh conditions. This represents a major step toward sustainable chemical manufacturing.',
      aiSummary:
        'Revolutionary green chemistry: converting sugars to valuable chemicals without catalysts, heat, or harsh conditions. Microdroplet technology enables spontaneous reactions at room temperature.',
      url: 'https://pubs.acs.org/doi/10.1021/jacs.green-chemistry',
      content:
        'This is the future of green chemistry! ♻️ Converting sugars to HMF with ZERO external reagents or heat. The microdroplet interface does all the work. Sustainable manufacturing is here!',
      topics: [chemistryTopic.id],
    },
    {
      userIndex: 5, // robert_chen
      doi: 'https://doi.org/10.1021/jacs.electric-field-2025',
      title:
        'Electric fields dramatically accelerate water autodissociation reaction',
      authors: ['Chemical Physics Lab'],
      journal: 'Journal of the American Chemical Society',
      year: 2025,
      impactFactor: 15.7,
      abstract:
        'Research demonstrates that electric fields can increase the water autodissociation equilibrium constant by several orders of magnitude by reshaping solvent organization. This fundamental discovery has implications for electrochemistry, catalysis, and understanding reactions in biological systems where local electric fields play crucial roles.',
      aiSummary:
        'Electric fields reshape how water molecules interact, accelerating autodissociation by orders of magnitude. This opens new pathways for controlling chemical reactions with precision.',
      url: 'https://pubs.acs.org/doi/10.1021/jacs.electric-field',
      content:
        'Mind-blowing chemistry! ⚡ Electric fields can speed up water autodissociation by ORDERS OF MAGNITUDE. This could revolutionize electrochemistry and catalysis.',
      topics: [chemistryTopic.id],
    },
    {
      userIndex: 6, // lisa_miller
      doi: 'https://doi.org/10.1257/aer.corporate-concentration-2024',
      title: '100 Years of Rising Corporate Concentration',
      authors: [
        'Spencer Y. Kwon',
        'Yueran Ma',
        'Kaspar Zimmermann',
      ],
      journal: 'American Economic Review',
      year: 2024,
      impactFactor: 10.7,
      abstract:
        'Comprehensive analysis of corporate concentration in the United States over a century reveals persistent trends toward market consolidation. The research examines implications for competition, innovation, labor markets, and inequality. Findings suggest concentration has accelerated since the 1980s with significant economic consequences.',
      aiSummary:
        'A century of data reveals persistent corporate consolidation in America, accelerating since the 1980s. This concentration affects competition, wages, and economic inequality.',
      url: 'https://www.aeaweb.org/articles?id=10.1257/aer.corporate-concentration',
      content:
        '100 years of data tells a clear story: corporate concentration is increasing and accelerating. 📊 The implications for competition and inequality are profound. Essential reading for policymakers!',
      topics: [economicsTopic.id],
    },
    {
      userIndex: 6, // lisa_miller
      doi: 'https://doi.org/10.1257/aer.personalized-pricing-2024',
      title: 'Personalized Pricing and Competition',
      authors: ['Andrew Rhodes', 'Jidong Zhou'],
      journal: 'American Economic Review',
      year: 2024,
      impactFactor: 10.7,
      abstract:
        'Theoretical and empirical analysis of personalized pricing strategies in competitive markets. The research examines how firms use consumer data to set individualized prices and the welfare implications for consumers and society. Findings have important policy implications for privacy regulation and antitrust enforcement.',
      aiSummary:
        'How do personalized prices affect competition and consumer welfare? This research provides crucial insights for regulating data-driven pricing in the digital economy.',
      url: 'https://www.aeaweb.org/articles?id=10.1257/aer.personalized-pricing',
      content:
        'Important work on personalized pricing! 💰 As AI enables more sophisticated price discrimination, we need to understand the competitive and welfare implications. Great policy insights here.',
      topics: [economicsTopic.id],
    },
  ];

  // Create posts
  for (const postData of posts) {
    try {
      const user = createdUsers[postData.userIndex];
      if (!user) {
        console.log(`User not found for post: ${postData.title}`);
        continue;
      }

      // Check if citation already exists
      let citation = await citationRepository.findOne({
        where: { doi: postData.doi },
      });

      if (!citation) {
        // Create citation with full data
        citation = citationRepository.create({
          doi: postData.doi,
          title: postData.title,
          authors: postData.authors,
          journal: postData.journal,
          year: postData.year,
          impactFactor: postData.impactFactor,
          abstract: postData.abstract,
          aiSummary: postData.aiSummary,
          url: postData.url,
          imageUrl: `https://source.unsplash.com/800x600/?science,research,laboratory`,
        });
        await citationRepository.save(citation);
      }

      // Create post
      const post = postRepository.create({
        content: postData.content,
        citation: citation,
        citationId: citation.id,
        author: user,
        authorId: user.id,
        topics: postData.topics,
      });
      await postRepository.save(post);

      // Increment post count for topics
      for (const topicId of postData.topics) {
        await topicService.incrementPostCount(topicId);
      }

      console.log(`Created post: ${postData.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error creating post: ${error.message}`);
    }
  }

  console.log('\n✅ Demo data seeding complete!');
  await app.close();
}

seedDemoData()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  });
