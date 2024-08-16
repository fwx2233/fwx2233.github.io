---
layout: post
title: IoTMediator
tags: [paper]
author: author1
---

# Detecting and Handling IoT Interaction Threats in Multi-Platform Multi-Control-Channel Smart Homes

该文章实现了一个在物联网设备和平台之间的中继器（Mediator），能够检测跨平台（CAI）以及多控制通道（CMAI）的automation rules威胁检测，并尝试提出解决方案供用户选择。

其特点是：
1) 将用户控制行为（manual control）也考虑在其中，**这是目前我见到的其他工作都没能做到的一点**；
2) 利用建模的方式发现行为之间的冲突，并同样利用建模尝试提出建议供用户选择。

[原文链接](https://www.usenix.org/system/files/sec23fall-prepub-185-chi-haotian.pdf)，发表在2023年USNIX。



## 作者信息

![image-20240806141720378](..\Images\IOTMEDIATOR\Snipaste_2024-08-15_17-52-26.png)



## Abstract

A smart home involves a variety of entities, such as IoT devices, automation applications, humans, voice assistants, and companion apps. These entities interact in the same physical environment, which can yield undesirable and even hazardous results, called IoT interaction threats. Existing work on interaction threats is limited to considering automation apps, ignoring other IoT control channels, such as voice commands, companion apps, and physical operations. Second, it becomes increasingly common that a smart home utilizes multiple IoT platforms, each of which has a partial view of device states and may issue conflicting commands. Third, compared to detecting interaction threats, their handling is much less studied. Prior work uses generic handling policies, which are unlikely to fit all homes. We present IOTMEDIATOR, which provides accurate threat detection and threat-tailored handling in multiplatform multi-control-channel homes. Our evaluation in two real-world homes demonstrates that IOTMEDIATOR significantly outperforms prior state-of-the-art work.

## CAI and CMAI
![image-cai-and-cmai](..\Images\IOTMEDIATOR\Snipaste_2024-08-15_17-56-58.png)

CAI：其实和标题中的Multi-Platform基本是一个含义，对应着现在的物联网设备有很多家厂商、很多的APP，可能同一个设备会有多个APP控制；或者不同平台控制各自的设备，但是这些设备之间可能会有交互（可以看作是平台之间规则的交互）

CMAI：也就是多控制通道，包括有云平台控制（如自动化规则、命令等）、物理环境控制（声光热力电等）、人工控制（按下开关等）

## Contribution
1. Detecting Cross Manual-control and Automation Interaction (CMAI) Threats. 
2. Supporting Multi-Platform Homes.
3. Threat-Tailored Handling.

## Threat Model
和大多数文章一样，该文章中的攻击者具有以下能力：
1. 鉴于这些广泛安装的应用程序，攻击者可以开发和推广与流行应用程序产生交互威胁的应用程序。
2. 通过嗅探家中加密的WiFi流量，攻击者可以推断出受害者家中的设备和应用信息，并利用这些信息注入和预测交互威胁。
3. 攻击者可以控制家庭中容易遭受到攻击的设备进而影响其他设备。

## Challenges
1. Monitoring manual controls in real time is required for detecting CMAI threats.

2. Threat detection across multiple platforms needs a global view.

3. Threat-tailored handling is needed. 之前的方法有让用户重写的、重新配置的（静态），也有制定的一些policies强制在运行过程中需要遵循的。

## Architecture of IoTMediator
![archi](..\Images\IOTMEDIATOR\Snipaste_2024-08-16_14-05-20.png)

如上图所示是IoTMediator的架构，可以看见本文工作是运行在设备和平台之间，充当中继器（甚至是网关）的角色，其共分为三个部分：Messenger, Threat Detection, Threat Handling。

### Messenger
主要功能是作为中间消息的传递，具有本地所有设备的全局视角（包括本地设备的所有event、要执行的command、云平台的消息），分为device gateway和device virtualization两个部分，分别负责与设备和云进行交互。其能力为：

（1）拦截来自设备的所有event并转发到对应的平台

（2）拦截所有来自automation app、companion app、voice command的网络空间指令并转发到设备

（3）自己生成指令并发送到设备

### Threat Detection
用来检测指令、event等是否存在安全风险。可以分为Candidate screening和Dynamic verification两个部分。其中Candidate screening将提取出的规则（IFTTT之类的）进行符号化的抽象表示，并利用这些符号静态分析，看是否存在潜在的风险；Dynamic verification则是动态运行，实时监测是否出现问题（部分静态结果可能并不会真正的导致安全隐患）。

#### Candidate screening
1. 规则获取

首先需要获取当前家庭中所有设备、平台的自动化规则等，其中获取自动化规则以前的工作已经提供了方案，具体可以看文章的参考文献；而本文还需要做的一点是获得设备的所有能力，比如物理上进行开关等，这些是在设备join阶段就能获取的。
> 我其实挺纳闷这里是怎么得到的

2. 识别CAI candidates

任何一条自动化规则可以表示为R _i_ = ⟨T _i_,C _i_, A _i_⟩ (i = 1, 2)的形式，其中T表示trigger，C表示condition，A表示action。则R _1_, R _2_可能存在的交互形式如下：

![CAI-interception](..\Images\IOTMEDIATOR\Snipaste_2024-08-16_14-25-52.png)

图中具体符号的含义为：
![symbol-sym](..\Images\IOTMEDIATOR\Snipaste_2024-08-16_14-26-38.png)

3. 识别CMAI
形式化表示为：R _i_ = ⟨c _i_,C _i_, A _i_⟩ (i = 1, 2)，其中c表示manual control，可能存在的交互形式如下：
![CMAI-interception](..\Images\IOTMEDIATOR\Snipaste_2024-08-16_14-27-54.png)

#### Dynamic verification
通过静态分析筛选candidate具有快速识别潜在交互案例的优点，但不能精确确定candidate是否实际发生在真实环境中。例如某个规则在下午6点打开空间加热器不会导致开窗，除非加热器将温度传感器的读数提高到阈值以上(注意温度传感器可能与加热器有一段距离)。

1. 识别manual control和automation

识别automation相对比较容易，因为这些一般是由平台/automation app发出，会形成cyberspace command，识别了这些就能识别出automation；manual control则是无法通过这些来识别，但是其在实现操作后，会在云平台上产生一些log，监听这些就能进行识别。

2. 检测real interactions

给定一个interaction candidate后，dynamic verfication组件会根据一些断言来判断是否真正产生了影响，具体断言如下：

![assertions](..\Images\IOTMEDIATOR\Snipaste_2024-08-16_14-34-57.png)

> 具体如何利用这些断言进行判断，参考文章中4.2.2节的详细内容

### Handling Interaction Threats
简单来说就是根据发现的问题原因对症下药，提供对应的解决措施建议，由用户选择如何执行。文章作者将问题是否能够被划为threat归结为三个因素：（1）交互模式；（2）涉及的自动化应用程序和/或手动控制；（3）用户意图/偏好。对于工具来说，提取前两个是容易的，但是第三点则是工具无法完成的。

以其他工作为例：有的工作尝试提出通用的办法来处理他们检测到的认为有问题的交互模式，以相同的方式处理相同模式的所有交互(因素(a))，减少了用户的努力，但忽略了实际涉及的应用程序和/或手动控制(因素(b))，当然也忽略了用户的意图(因素(c));

本文工作则是根据当前交互威胁的类型生成几种可行的解决措施，让用户来抉择，生成的模式如下：

![options](..\Images\IOTMEDIATOR\Snipaste_2024-08-16_14-42-11.png)

关于生成的具体样例、实验部分、limitation等可以去原文中参考，这里就不赘述了。


## Conclusion
最后对这篇文章做一个小的总结吧：这篇文章就是在网关的基础上做了对家庭中所有设备的交互行为做了安全检测，并向用户提出建议的解决措施，这篇文章我认为最大的贡献有以下几点：
1. 尝试将manual control在整个模型中具象化了，这个是其他所有工作都没有做到的一点，其具象方式是直接收集device的所有功能，并利用log、event进行监测，是个很好的角度；
2. 利用对各种交互类型的理解，生成通用的公式表达以及处理方案，和原本的一刀切、让用户自己去修改相比要更加人性化，且更具有泛用性；

感觉本文的这种抽象化符号、公式表达可以借鉴学习，同时manual control的这个角度也不错，可以想想有没有其他的体现方式。缺点的话，说实话我暂时没有想到太多的缺点，感觉硬要说就是manual effort有点太多，感觉提出建议等的方式可以尝试使用大模型进行解决？我也不确定，总感觉缺了一点东西，说实话没有多少思考。

文章作者未来想要继续做的工作是：这项工作的重点是智能家居。大的空间，如校园，可以分成几个小的子空间，如建筑物/房间。通过这种方式，可以以可扩展的方式检测子空间中的交互威胁。挑战在于如何正确划分大空间以及如何跨子空间检测威胁。此外，这项工作考虑了最常见的交互模式，其中自动化规则与另一个规则(或手动控制)交互。实际上，两条规则的交互效果可以建模为一条虚拟规则，该虚拟规则与另一条规则交互。现有技术 **\[参考文献15\]** 可以应用于研究这类特殊的交互威胁案例。