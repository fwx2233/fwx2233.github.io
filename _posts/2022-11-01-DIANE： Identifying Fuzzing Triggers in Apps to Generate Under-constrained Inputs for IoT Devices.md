---
layout: post
title: DIANE notes
tags: [paper]
author: author1
---
# DIANE: Identifying Fuzzing Triggers in Apps to Generate Under-constrained Inputs for IoT Devices

一篇关于在App端进行fuzz的文章，[原文链接](https://ieeexplore.ieee.org/document/9519432/)

## 文章信息

**Author:** Nilo Redini*∗* , Andrea Continella*†* , Dipanjan Das*∗* , Giulio De Pasquale*∗* , Noah Spahn*∗* , Aravind Machiry*‡* , Antonio Bianchi*‡* , Christopher Kruegel*∗* , and Giovanni Vigna

**Company**: *∗*UC Santa Barbara,  *†*University of Twente,  *‡*Purdue University

**Publisher**: IEEE S&P

**Year**: 2021

## Abstract

&emsp;Internet of Things (IoT) devices have rooted themselves in the everyday life of billions of people. Thus, researchers have applied automated bug finding techniques to improve their overall security. However, due to the difficulties in extracting and emulating custom firmware, black-box fuzzing is often the only viable analysis option. Unfortunately, this solution mostly produces invalid inputs, which are quickly discarded by the targeted IoT device and do not penetrate its code. Another proposed approach is to leverage the companion app (i.e., the mobile app typically used to control an IoT device) to generate well-structured fuzzing inputs. Unfortunately, the existing solutions produce fuzzing inputs that are constrained by app-side validation code, thus significantly limiting the range of discovered vulnerabilities.

&emsp;In this paper, we propose a novel approach that overcomes these limitations. Our key observation is that there exist functions inside the companion app that can be used to generate optimal (i.e., valid yet under-constrained) fuzzing inputs. Such functions, which we call fuzzing triggers, are executed before any data-transforming functions (e.g., network serialization), but after the input validation code. Consequently, they generate inputs that are not constrained by app-side sanitization code, and, at the same time, are not discarded by the analyzed IoT device due to their invalid format. We design and develop DIANE, a tool that combines static and dynamic analysis to find fuzzing triggers in Android companion apps, and then uses them to fuzz IoT devices automatically. We use DIANE to analyze 11 popular IoT devices, and identify 11 bugs, 9 of which are zero days. Our results also show that without using fuzzing triggers, it is not possible to generate bug-triggering inputs for many devices.

## Notes

相关笔记见[PDF文件](../pdfs/DIANE Note.pdf)

## Some Questions

> 在文章第三章-A(Fuzzing Trigger Identification)-Step 2中，为了动态验证*sendMessage candidatie* 里究竟哪些是真正的sendMessage，作者使用了timestamp的方式进行聚类，文章认为：能够引起网络活动的函数具有更小的平均值和标准差(timestamp)，因为他们更难受到noise的影响。

关于上述这点我感到非常奇怪：

1. 他们是怎么得到这个间隔时间的。按理说，从函数执行到产生网络行为这个过程的时间间隔是非常短的，他们是使用什么方法能够精确获取这样的时间差；
2. 为什么这些函数会更难受到噪音的影响？这里的噪音指的是什么样的噪音？
