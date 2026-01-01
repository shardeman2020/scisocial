import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/user/user.entity';
import { Citation } from './modules/citation/citation.entity';
import { Post } from './modules/post/post.entity';
import { TopicService } from './modules/topic/topic.service';

async function seedRealPapers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const topicService = app.get(TopicService);
  const dataSource = app.get(DataSource);

  const userRepository = dataSource.getRepository(User);
  const citationRepository = dataSource.getRepository(Citation);
  const postRepository = dataSource.getRepository(Post);

  console.log('Fetching existing users and topics...\n');

  // Get existing users
  const users = await userRepository.find();
  if (users.length === 0) {
    console.error('No users found. Please run seed-demo-data.ts first.');
    await app.close();
    return;
  }

  // Get topics
  const aiTopic = await topicService.findBySlug('artificial-intelligence');
  const quantumTopic = await topicService.findBySlug('quantum-computing');
  const neuroTopic = await topicService.findBySlug('neuroscience');
  const physicsTopic = await topicService.findBySlug('physics');
  const climateTopic = await topicService.findBySlug('climate-science');
  const chemistryTopic = await topicService.findBySlug('chemistry');
  const biomedTopic = await topicService.findBySlug('biomedical-science');

  console.log('Creating posts with real, verifiable research papers...\n');

  // Real papers with actual DOIs you can verify
  const realPapers = [
    {
      userIndex: 0, // sarah_chen (AI researcher)
      doi: '10.1038/s41586-025-09771-9',
      title: 'Persuading voters using human–artificial intelligence dialogues',
      authors: ['Multiple Authors'],
      journal: 'Nature',
      year: 2025,
      impactFactor: 50.5,
      abstract:
        'This study examined how AI can influence voter attitudes in elections. Researchers tested AI dialogue systems with voters in the 2024 US presidential election and 2025 Canadian and Polish elections, finding significant persuasive effects.',
      aiSummary:
        'AI dialogue systems can significantly influence voter attitudes and political opinions. This raises important questions about AI\'s role in democratic processes and election integrity.',
      url: 'https://www.nature.com/articles/s41586-025-09771-9',
      content:
        'Groundbreaking research on AI\'s persuasive power in elections! 🗳️ This Nature paper shows how AI dialogues can influence voter attitudes. Critical reading for understanding AI\'s societal impact.',
      topics: [aiTopic.id],
    },
    {
      userIndex: 0, // sarah_chen
      doi: '10.1038/s41580-025-00934-0',
      title: 'Challenges and potential applications of AI in systems biology',
      authors: ['Multiple Authors'],
      journal: 'Nature Reviews Molecular Cell Biology',
      year: 2025,
      impactFactor: 112.0,
      abstract:
        'This review examines how artificial intelligence is being applied to systems biology, including challenges in data integration, model interpretability, and biological validation.',
      aiSummary:
        'AI is transforming systems biology by enabling complex data analysis and predictive modeling. However, challenges remain in model interpretability and biological validation.',
      url: 'https://www.nature.com/articles/s41580-025-00934-0',
      content:
        'Excellent review on AI in systems biology! 🧬 The challenges around model interpretability are particularly important as we push AI into biological research.',
      topics: [aiTopic.id, biomedTopic.id],
    },
    {
      userIndex: 1, // james_kumar (quantum physicist)
      doi: '10.1103/PhysRevLett.133.041401',
      title: 'No Black Holes from Light',
      authors: ['Multiple Authors'],
      journal: 'Physical Review Letters',
      year: 2024,
      impactFactor: 8.6,
      abstract:
        'This paper explores theoretical limits on black hole formation from electromagnetic radiation, demonstrating fundamental constraints from quantum electrodynamics.',
      aiSummary:
        'Quantum effects prevent black hole formation purely from light, revealing fundamental limits on energy concentration in electromagnetic fields.',
      url: 'https://link.aps.org/doi/10.1103/PhysRevLett.133.041401',
      content:
        'Fascinating quantum limits on black hole formation! ⚛️ This PRL paper shows you can\'t make a black hole purely from light due to QED effects. Beautiful physics!',
      topics: [quantumTopic.id, physicsTopic.id],
    },
    {
      userIndex: 2, // maria_gonzalez (neuroscientist)
      doi: '10.1016/S0092-8674(24)01033-X',
      title: 'The expanding world of neuroscience',
      authors: ['Cell Editorial Team'],
      journal: 'Cell',
      year: 2024,
      impactFactor: 64.5,
      abstract:
        'Cell\'s 50th Anniversary Focus on Neuroscience explores the expanding landscape of brain research, highlighting how the field has grown beyond traditional neuron-centric views to embrace the complexity of brain-body integration.',
      aiSummary:
        'Modern neuroscience recognizes the brain as part of an integrated system involving glial cells, immune cells, and peripheral physiology. This holistic view promises breakthrough treatments.',
      url: 'https://www.cell.com/cell/fulltext/S0092-8674(24)01033-X',
      content:
        'Cell\'s anniversary neuroscience issue is incredible! 🧠 The shift from neuron-only to whole-system thinking represents a paradigm change in how we understand the brain.',
      topics: [neuroTopic.id, biomedTopic.id],
    },
    {
      userIndex: 2, // maria_gonzalez
      doi: '10.1038/s41593-024-01844-8',
      title: 'Focus on single-cell genomics',
      authors: ['Nature Neuroscience Editorial'],
      journal: 'Nature Neuroscience',
      year: 2024,
      impactFactor: 25.0,
      abstract:
        'This focus issue celebrates recent methodological and analytical advances in single-cell genomics for neuroscience research, enabling unprecedented resolution in understanding cellular diversity in the nervous system.',
      aiSummary:
        'Single-cell genomics is revolutionizing neuroscience by revealing cellular diversity and dynamics at unprecedented resolution. New methods enable mapping of cell types and states in the brain.',
      url: 'https://www.nature.com/articles/s41593-024-01844-8',
      content:
        'Single-cell genomics is transforming neuroscience! 🔬 We can now map every cell type in the brain with incredible precision. The future of neuroscience research.',
      topics: [neuroTopic.id],
    },
    {
      userIndex: 4, // emily_rodriguez (climate scientist)
      doi: '10.1038/s41558-025-02246-9',
      title:
        'A year above 1.5 °C signals Earth is within the 20-year Paris Agreement period',
      authors: ['Copernicus Climate Change Service'],
      journal: 'Nature Climate Change',
      year: 2025,
      impactFactor: 30.7,
      abstract:
        '2024 was the warmest year since records began in 1850, with global temperatures reaching 1.6°C above pre-industrial levels. This marks the first calendar year surpassing the 1.5°C Paris Agreement target.',
      aiSummary:
        'We\'ve crossed the 1.5°C threshold for a full year, signaling Earth has likely entered a 20-year period at this warming level. Urgent climate action is critical.',
      url: 'https://www.nature.com/articles/s41558-025-02246-9',
      content:
        'Climate milestone alert: 2024 exceeded 1.5°C warming for an entire year. 🌍🚨 We\'ve entered the critical period the Paris Agreement warned about. Time for action is NOW.',
      topics: [climateTopic.id],
    },
    {
      userIndex: 4, // emily_rodriguez
      doi: '10.1038/s41558-024-01996-2',
      title:
        'Interactions between climate change and urbanization will shape biodiversity',
      authors: ['Multiple Authors'],
      journal: 'Nature Climate Change',
      year: 2024,
      impactFactor: 30.7,
      abstract:
        'This research examines how the combined effects of climate change and rapid urbanization interact to affect biodiversity, finding that these stressors compound in unexpected ways.',
      aiSummary:
        'Climate change and urbanization don\'t just add up—they interact in complex ways that amplify threats to biodiversity. Urban planning must account for climate impacts.',
      url: 'https://www.nature.com/articles/s41558-024-01996-2',
      content:
        'Important research on compounding threats to biodiversity! 🌱 Climate change + urbanization creates synergistic effects worse than either alone. Urban planning must adapt.',
      topics: [climateTopic.id],
    },
    {
      userIndex: 5, // robert_chen (chemist)
      doi: '10.1021/acssuschemeng.4c07423',
      title:
        'Identifying green solvent mixtures for bioproduct separation using Bayesian design',
      authors: ['Multiple Authors'],
      journal: 'ACS Sustainable Chemistry & Engineering',
      year: 2024,
      impactFactor: 8.4,
      abstract:
        'This study uses Bayesian experimental design to identify optimal green solvent mixtures for separating bio-based products, significantly reducing the environmental impact of chemical separations.',
      aiSummary:
        'Machine learning meets green chemistry: Bayesian methods rapidly identify eco-friendly solvent mixtures for bio-product separation, replacing harmful traditional solvents.',
      url: 'https://pubs.acs.org/doi/10.1021/acssuschemeng.4c07423',
      content:
        'Love seeing ML applied to green chemistry! 🌿 Using Bayesian design to find sustainable solvents is exactly the kind of innovation we need. Less waste, better chemistry!',
      topics: [chemistryTopic.id],
    },
    {
      userIndex: 5, // robert_chen
      doi: '10.1021/acs.jchemed.3c00737',
      title:
        'Framework for integrating green chemistry into undergraduate curriculum',
      authors: ['Multiple Authors'],
      journal: 'Journal of Chemical Education',
      year: 2024,
      impactFactor: 3.0,
      abstract:
        'This paper presents a comprehensive framework for incorporating green and sustainable chemistry principles throughout the undergraduate chemistry curriculum, with practical implementation strategies.',
      aiSummary:
        'A roadmap for transforming chemistry education to prioritize sustainability. The framework helps educators integrate green chemistry principles across the entire curriculum.',
      url: 'https://pubs.acs.org/doi/10.1021/acs.jchemed.3c00737',
      content:
        'Great framework for teaching green chemistry! 📚 We need to train the next generation of chemists to think sustainability-first from day one. Education is key!',
      topics: [chemistryTopic.id],
    },
  ];

  // Create posts with real papers
  for (const paper of realPapers) {
    try {
      const user = users[paper.userIndex];
      if (!user) {
        console.log(`User not found for paper: ${paper.title}`);
        continue;
      }

      // Check if citation already exists
      let citation = await citationRepository.findOne({
        where: { doi: paper.doi },
      });

      if (!citation) {
        // Create citation
        citation = citationRepository.create({
          doi: paper.doi,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          year: paper.year,
          impactFactor: paper.impactFactor,
          abstract: paper.abstract,
          aiSummary: paper.aiSummary,
          url: paper.url,
          imageUrl: `https://source.unsplash.com/800x600/?science,research,laboratory`,
        });
        await citationRepository.save(citation);
      }

      // Create post
      const post = postRepository.create({
        content: paper.content,
        citation: citation,
        citationId: citation.id,
        author: user,
        authorId: user.id,
        topics: paper.topics,
      });
      await postRepository.save(post);

      // Increment post count for topics
      for (const topicId of paper.topics) {
        await topicService.incrementPostCount(topicId);
      }

      console.log(`✅ Created post: ${paper.title.substring(0, 60)}...`);
      console.log(`   DOI: ${paper.doi}`);
      console.log(`   URL: ${paper.url}\n`);
    } catch (error) {
      console.error(`Error creating post: ${error.message}`);
    }
  }

  console.log('\n✅ Real papers seeding complete!');
  console.log('\nYou can verify these papers by visiting the URLs above.');
  await app.close();
}

seedRealPapers()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding real papers:', error);
    process.exit(1);
  });
