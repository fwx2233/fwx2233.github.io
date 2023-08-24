---
layout: post
title: Fingerprinting BLE Devices by model learning
tags: [paper]
author: author1
---

# Fingerprinting and Analysis of Bluetooth Devices with Automata Learning

这篇文章的核心想法是利用主动学习的方式为BLE设备建立fingerprint，理由为：不同设备在实现BLE协议时会有不同的特点（协议栈有区别），比如某些方法能使用但是某些方法不能使用。因此可以尝试利用主动学习的方法，通过对协议具体实现进行建模，以model作为BLE设备的fingerprint。[原文链接](https://link.springer.com/article/10.1007/s10703-023-00425-y)

# Information

**Author:** Andrea Pferscher, Bernhard K. Aichernig

**Year:** 2023

**Publish**: arXiv

# Abstract

Automata learning is a technique to automatically infer behavioral models of black-box systems. Today’s learning algorithms enable the deduction of models that describe complex system properties, e.g., timed or stochastic behavior. Despite recent improvements in the scalability of learning algorithms, their practical applicability is still an open issue. Little work exists that actually learns models of physical black-box systems. To fill this gap in the literature, we present a case study on applying automata learning on the Bluetooth Low Energy (BLE) protocol. It shows that not only the size of the system limits the applicability of automata learning. Also, the interaction with the system under learning creates a major bottleneck that is rarely discussed. In this article, we propose a general automata learning architecture for learning a behavioral model of the BLE protocol implemented by a physical device. With this framework, we can successfully learn the behavior of six investigated BLE devices. Furthermore, we extended the learning technique to learn security critical behavior, e.g., key-exchange procedures for encrypted communication. The learned models depict several behavioral differences and inconsistencies to the BLE specification. This shows that automata learning can be used for fingerprinting black-box devices, i.e., characterizing systems via their specific learned models. Moreover, learning revealed a crashing scenario for one device.



# Contribution

1. A learning framework that enables learning of BLE protocol implementations of peripheral devices. The framework including the learned models are available [online](https://github.com/apferscher/ble-learning).
2. An extension of the learning framework that enables the learning of the key-exchange protocol during the BLE pairing procedure.
3. A case study that evaluates our framework on real physical devices.
4. A model-based manual analysis that checks if the devices conform to the BLE specification.
5. A sequence found by learning that crashes a BLE device. 
6. A sequence that allows fingerprinting of the investigated BLE devices.



# Valuable Points

1. 我们也可以认为设备在待匹配的状态就能算是一个initial的状态（同时还需要考虑手机上要怎么设置，类似重装？或者是delete device之后的那个）。这样感觉可以不用考虑reset的这个事了
2. 由于超时或者是丢包造成的non-deterministic的问题，本文没有使用重发的方式（因为重发对效率的影响较大），而是提出了另一种解决方案：saving of query. 该方案基于丢包是小概率事件的假设，仅重发表现出non-deterministic的包。感觉是符合直观感受的，在出现non的时候对刚刚的进行一次or多次重发，就能尝试避免non的问题，但问题在于：如果重发的次数太多，那么此时的服务器是否和刚刚的state是同一个state。
3. 状态机中有些地方可以进行约简，这样应该能有助于模型的简洁（类似于一些其他不关心的可以设置为某种统一的符号



# Reading List

[31] Inference of finite automata using homing sequences. Information and Computation（1993）该文章改进了L*算法中counterexample processing，特别是对于长的反例来说，他减少了查询请求的数量