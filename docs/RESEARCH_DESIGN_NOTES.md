# Research Design Working Notes

Status: **working discussion notes — not an approved protocol**  
Last updated: 2026-09-25

These notes capture the team's current thinking about a possible educational
effectiveness study for The Commissure. They are intentionally provisional.
They do **not** constitute a finalized protocol, statistical analysis plan,
ethics submission, or team decision. The design should be revised after input
from the prospective PI, relevant ethics/IRB review, and statistical/methodology
advice.

## 1. Current research question under consideration

A pragmatic first study may ask:

> Among medical students learning a cervical spine procedure, does learning with
> The Commissure lead to better immediate objective understanding than
> conventional 2D learning materials?

This framing treats The Commissure as an **integrated educational intervention**:
3D anatomy, interactivity, stepwise visualization, procedure-specific
explanations, and interface design are evaluated together.

The first study would therefore not attempt to identify the independent causal
contribution of 3D visualization, interactivity, animation, or UI design.

## 2. Why this framing is currently attractive

A more mechanistic comparison would use a tightly matched control, for example
the same 3D-derived content presented as static screenshots with interactivity
removed. That design is scientifically valid, but it creates two practical
issues:

1. The two interventions become very similar, so any true effect may be smaller
   and require a larger sample to estimate precisely.
2. Detecting that narrower effect may require outcome measures specifically
   sensitive to spatial or 3D understanding, which adds work in test design and
   validation.

For an initial effectiveness study, a comparison against representative
conventional learning material may therefore provide a more direct answer to the
practical question: **is The Commissure useful compared with how students would
normally study this topic?**

This should not be interpreted as intentionally weakening the control to obtain
statistical significance. The conventional 2D arm should be a fair and credible
representation of ordinary learning resources and should cover the same learning
topic for the same study period.

## 3. Current leading design

The present leading option is a simple two-arm, parallel randomized study:

1. Enroll medical students from one institution initially.
2. Collect a short baseline/pretest measure.
3. Randomize participants 1:1 to:
   - **Intervention:** The Commissure Web 3D learning experience.
   - **Control:** conventional 2D learning material such as textbook/atlas-style
     diagrams, schematics, and accompanying explanatory text.
4. Keep the learning topic and allotted study time comparable between groups.
5. Administer an objective immediate posttest.
6. Compare posttest performance between groups while adjusting for baseline
   knowledge.

A single procedure, rather than all available procedures, is currently favored
for the first study to keep the intervention, testing, and logistics manageable.
The exact procedure has not been selected.

## 4. Role of the pretest

The current discussion favors including a pretest.

The rationale is **not** that randomization requires correction for
"selection bias." With proper randomization, baseline differences can still
occur by chance. A baseline knowledge score may nevertheless be useful because
it can explain some participant-level variation in posttest performance and may
improve the precision of the treatment-effect estimate.

A simple primary analysis under consideration is an ANCOVA-type model:

```text
posttest score ~ study arm + baseline/pretest score
```

The exact pretest length and overlap with the posttest remain open questions.
The team should avoid making the pretest so detailed that it becomes a major
learning intervention itself.

## 5. Outcome design under consideration

The first study should favor a **simple objective test** rather than relying on
satisfaction or perceived usefulness as the main outcome.

A practical test could include questions covering:

- core anatomy;
- spatial/anatomical relationships;
- procedural sequence and understanding.

The current preference is to keep **one overall objective posttest score** as
the likely primary endpoint, with domain-specific scores considered secondary or
exploratory if useful.

A bespoke "3D cognition" test is not currently considered mandatory for the
first study. Such a measure becomes more important if the research question is
narrowed later to the independent effect of 3D visualization or interactivity.

Any test still needs review for medical accuracy, relevance to the learning
objectives, clarity, and fairness between study arms. The exact number and format
of questions are not yet decided.

## 6. Why not make static 3D the main control immediately?

A static version of the same 3D model remains a valuable future comparator.

However, using it as the first control changes the research question from:

> Is The Commissure more useful than conventional learning?

to something closer to:

> Does interactivity add benefit beyond viewing substantially the same 3D
> information statically?

The latter is a narrower mechanistic question. It may produce a smaller effect
and may demand more sensitive spatial outcome measures. The team currently views
that as a plausible **follow-up study**, especially if the initial pragmatic
comparison shows a meaningful educational effect.

## 7. VR comparison

A Web 3D versus VR 3D comparison is also considered a possible later study.

It is not currently favored as part of the first effectiveness study because a
third arm would increase recruitment requirements, hardware/logistical burden,
and the number of comparisons while answering a different question about display
modality.

A possible sequence is therefore:

1. The Commissure Web 3D vs conventional 2D learning.
2. If useful, static 3D vs interactive 3D to examine the contribution of
   interactivity.
3. If useful, Web 3D vs immersive VR to examine display modality.

This sequence is a working concept, not a publication commitment.

## 8. Scope deliberately left out for now

The following additions may be scientifically useful but are **not currently
assumed to be required** for the first study:

- multiple procedures in the same protocol;
- three or more study arms;
- crossover design;
- immersive VR;
- extensive interaction logging;
- bespoke research software or dashboards;
- a large battery of subjective scales;
- delayed retention testing.

A delayed retention test remains a reasonable option if long-term retention
becomes a central research aim, but it should not be added automatically if the
first study is intended only to test immediate learning effectiveness.

## 9. Important safeguards against a significance-driven design

The choice of comparator and outcomes should follow the research question, not a
desire to maximize the chance of a low p-value.

In particular:

- the 2D control should be credible conventional learning, not an intentionally
  poor or incomplete version;
- both arms should address the same learning topic and receive comparable study
  time;
- the primary outcome should be declared before looking at results;
- the study should compare the two randomized groups directly rather than infer
  superiority from significance within one group and non-significance within
  the other;
- sample-size planning should be performed before recruitment once the outcome,
  expected variability, and minimally meaningful effect are better defined.

## 10. Open decisions before protocol drafting

The following remain unresolved:

- target institution and participant year(s);
- prospective PI and study governance;
- procedure to study first;
- exact conventional 2D comparator;
- pretest content and length;
- posttest content and scoring;
- whether spatial/procedural subscores are prespecified secondary outcomes;
- allotted learning time;
- whether delayed retention is worth the added logistics;
- target sample size and recruitment feasibility;
- randomization and allocation procedures;
- ethics/IRB requirements and consent process;
- final statistical analysis plan.

These points should be resolved before treating the above as a protocol.
