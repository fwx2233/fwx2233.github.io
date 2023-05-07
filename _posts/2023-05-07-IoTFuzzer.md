---
layout: post
title: IoTFuzzer
tags: [paper]
author: author1
---
# IOTFUZZER: Discovering Memory Corruptions in IoT Through App-based Fuzzing

在APP端对IoT的Firmware进行内存fuzz的开山之作，[原文链接](https://www.ndss-symposium.org/wp-content/uploads/2018/02/ndss2018_01A-1_Chen_paper.pdf)

这里主要记录了一下High level的思想，具体实现细节需要自行查看文章


## Information

**Author:** Jiongyi Chen[1], Wenrui Diao[2], Qingchuan Zhao[3], XiaoFeng Wang[4], *et al.*

**Company**: [1]The Chinese University of Hong Kong; [2]Jinan University, [3]The University of Texas at Dallas, [4]Indiana University Bloomington

**Publisher**: NDSS

**Year**: 2018


## Abstract

    With more IoT devices entering the consumer market, it becomes imperative to detect their security vulnerabilities before an attacker does. Existing binary analysis based approaches only work on firmware, which is less accessible except for those equipped with special tools for extracting the code from the device. To address this challenge in IoT security analysis, we present in this paper a novel automatic fuzzing framework, called IOTFUZZER, which aims at finding memory corruption vulnerabilities in IoT devices without access to their firmware images. The key idea is based upon the observation that most IoT devices are controlled through their official mobile apps, and such an app often contains rich information about the protocol it uses to communicate with its device. Therefore, by identifying and reusing program-specific logic (e.g., encryption) to mutate the test case (particularly message fields), we are able to effectively probe IoT targets without relying on any knowledge about its protocol specifications. In our research, we implemented IOTFUZZER and evaluated 17 real-world IoT devices running on different protocols, and our approach successfully identified 15 memory corruption vulnerabilities (including 8 previously unknown ones).


## Main Idea

物联网设备固件的安全性一直是关注的热点，但固件通常难以获取（厂商不开源），且获取到的固件映像可能不支持debug模式，导致难以直接分析固件。经过观察发现，物联网设备可以接收来自应用程序的指令执行相应操作，而APP非常容易获取和反编译，由此产生一个角度：通过修改APP中指令的字段，看设备中是否存在漏洞。

则综上得到本文的核心思路：利用APP中的字段对设备固件进行模糊测试，触发固件漏洞


## Challenges and Solutions

### Challenges

1. **Mutating fields in networking messages.** 不同厂商很可能使用各自定制的协议进行网络通讯，fuzz时需要对这些协议能够适配，如何应对各种不同的协议字段是一个问题；
2. **Handling encrypted messages.** APP和设备之间的通讯可能是经过加密处理的，虽然可以通过逆向等方式分析加密流程、密钥，这会很复杂，需要一个轻量级的方法来应对加密通讯；
3. **Monitoring crashes.** 当内存中的crash产生时，我们是无法得知设备中实时的状态的，也无从得知是什么消息造成了crash；而且不同设备crash的表现形式可能不同，很难通过error messages自动化地识别crash。

### Solutions

1. **Mutating protocol fields at data sources.** 从源头进行mutate，源头中的字段总是会被一定函数处理之后在协议中的某个字段得以体现，这样就不用去管协议的format是什么样了；
2. **Reusing cryptographic functions at runtime.** 不用刻意去分析加密函数到底是什么、密钥是什么，只需要使用程序中原本已经实现好的函数流就行，只要能触发他们的通讯，该执行流会自动对消息进行正确的加密；
3. **Detecting liveness with heartbeat mechanism.** 利用heartbeat机制检测即可。


## Tools

建立应用程序的Call Graph: 

* Androguard
* EdgeMiner
* Monkeyrunner

污点分析工具：

* TaintDroid
