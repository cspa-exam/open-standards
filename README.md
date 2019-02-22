# The CSPA Open Standards

[CSPA](cspa.io) is a tech company dedicated to streamlining the job market. This open source project is part of our efforts to find answers to some difficult questions:

- Why do programmers have to repeatedly take widely-varying and subjectively written technical tests each and every time they interview at a company?
- Why do companies have to spend time reviewing each candidate as if from scratch?
- What does it mean to be competent in a language, framework, or technology? Can we encode these requirements in a precise, standardized way?

These are not easy questions to answer! And we're not certainly not trying to do it alone. If you would like to input your expertise, please [apply for the Technical Steering Committee](https://cspa.io/tsc/apply).

## The JavaScript Open Standard

The first tech we're targeting is the ever-increasingly ubiquitous JavaScript. JavaScript has a long history of quirks, great features, and misunderstandings – it's the perfect language to target first.

By providing these open standards, we hope to provide empirical guidance to programmers on what exactly they need to learn to start working in the industry. Because they are open, everyone in the world is free to not only write educational materials to teach these topics, but also to recognize them as the standard of competence when hiring new software developers for their team.

Our ultimate goal is to make the software industry a better place! You can view this work-in-progress [here](./standards/JavaScript).

## Question Format

Each set of questions is an `xml` file with several questions in them. Here are the formats you can expect:

```xml
<!-- A group of questions that are highly similar. -->
<group name="My Group"></group>

<!--
  A multiple-choice question is a question where the user
  selects a single answer from a set of pre-defined choices.
  This is the default question type.
-->
<question type="multiple-choice">
  <!--
    The contents of the question ask;
    This is common across all questions
  -->
  <body>What is 2 + 2?</body>

  <!--
    A multiple-choice question MUST have at least one choice-group.
    A choice-group name must be unique within its question.
    The default name is "default".
  -->
  <choice-group name="default">
    <!--
      Choices can be marked with the answer attribute.
      Exactly one MUST be marked as answer.
    -->
    <choice>2</choice>
    <choice answer>4</choice>
  </choice-group>
</question>

<!--
  A line-numbers question is a question where the user selects
  one or more lines from a block of code.
-->
<question type="line-numbers">
  <body></body>

  <!--
    The code to select lines from.
    The default language is "javascript".
  -->
  <code lang="javascript"></code>

  <!--
    A comma-separated list of line numbers.
    If the `optional` attribute is present,
    the user will be presented a button with
    the text "None of the above"
  -->
  <answer></answer>
</question>
```
