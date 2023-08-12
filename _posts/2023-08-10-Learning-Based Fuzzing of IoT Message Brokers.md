---
layout: post
title: Learning-Based Fuzzing-MQTT
tags: [paper]
author: author1
---

# Learning-Based Fuzzing of IoT Message Brokers

给应用MQTT协议的Broker建模、Fuzz的文章，[原文链接](https://ieeexplore.ieee.org/document/9438590)。

## 1. Information

**Author**: Bernhard K. Aichernig; Edi Muskardi; Andrea Pferscher

**Company**: Institute of Software Technology

**Publisher**: IEEE ICST

**Year**: 2021

**Abstract**: The number of devices in the Internet of Things (IoT) immensely grew in recent years. A frequent challenge in the assurance of the dependability of IoT systems is that components of the system appear as a black box. This paper presents a semi-automatic testing methodology for black-box systems that combines automata learning and fuzz testing. Our testing technique uses stateful fuzzing based on a model that is automatically inferred by automata learning. Applying this technique, we can simultaneously test multiple implementations for unexpected behavior and possible security vulnerabilities.

We show the effectiveness of our learning-based fuzzing technique in a case study on the MQTT protocol. MQTT is a widely used publish/subscribe protocol in the IoT. Our case study reveals several inconsistencies between five different MQTT brokers. The found inconsistencies expose possible security vulnerabilities and violations of the MQTT specification.



## 2. Contributions

1. We present our learning-based fuzzing technique.
2. We evaluate our fuzzing technique in a case study on the MQTT protocol and report the found bugs in different MQTT brokers.
3. The implementation of our learning-based fuzzing framework on MQTT brokers is available online





## 3. Main Ideas

核心想法：用主动学习算法学习一个状态机，然后在model的基础上进行fuzz，观察fuzz的结果和状态机是否产生不一致的现象。**好处**是本文只需要学习一个状态机就够了（相比参考文献[5]里需要学习多个状态机进行两两对比，本文的方法学习成本要低一些）。整体过程分为learning和fuzzing两个步骤。

![image-20230810174700211](C:\Users\付文轩\AppData\Roaming\Typora\typora-user-images\image-20230810174700211.png)

**Learning阶段面临的问题：**

1. 应对比较庞大的mapper：本文尝试定义更加抽象的input和output的symbol，然后引入了一个组件，对刚刚更加抽象的这些东西进行具象化（包括input和output），学习算法会选择某个abstract的input交给mapper，然后由mapper随机选择一个具体的输入进行发送。
2. 由于时延或者timeout，MQTT broker可能存在非确定性问题。这篇文章里只是增加了等待时长，认为这个就够了（？？？）

**Learning阶段利用random walk方式检查是否存在counterexample:**

probability of resetting--0.09; maximum number of steps--3000; 并且每次发现counterexample以后会重置step counter（那也就是说3000 steps之内如果发现不了，就停止当前探索了；如果发现了就刷新并继续探索）

**Fuzz阶段:**

1. 使用random walk的方式进行检测
2. Configeration为：每次random walk--50；共进行1000次random walk
3. 如果fuzz的时候发现了counterexample，就人工查看问题