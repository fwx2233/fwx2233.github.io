---

---

# Evasion Attacks and Defenses on Smart Home Physical Event Verification

## Information

**Author**: Muslum Ozgur Ozmen, Ruoyu Song, Habiba Farrukh, and Z. Berkay Celik

**Company**: Purdue University

**Publisher**: NDSS

**Year**: 2023

**Abstract**: In smart homes, when an actuator’s state changes, it sends an event notification to the IoT hub to report this change (e.g., the door is unlocked). Prior works have shown that event notifications are vulnerable to spoofing and masking attacks. In event spoofing, an adversary reports to the IoT hub a fake event notification that did not physically occur. In event masking, an adversary suppresses the notification of an event that physically occurred. These attacks create inconsistencies between physical and cyber states of actuators, enabling an adversary to indirectly gain control over safety-critical devices by triggering IoT apps. To mitigate these attacks, event verification systems (EVS), or broadly IoT anomaly detection systems, leverage physical event fingerprints that describe the relations between events and their influence on sensor readings. However, smart homes have complex physical interactions between events and sensors that characterize the event fingerprints. Our study of the recent EVS, unfortunately, has revealed that they widely ignore such interactions, which enables an adversary to evade these systems and launch successful event spoofing and masking attacks without getting detected. 

&emsp;In this paper, we first explore the evadable physical event fingerprints and show that an adversary can realize them to bypass the EVS given the same threat model. We develop two defenses, EVS software patching and sensor placement, with the interplay of physical modeling and formal analysis, to generate robust physical event fingerprints and demonstrate how they can be integrated into the EVS. We evaluate the effectiveness of our approach in two smart home settings that contain 12 actuators and 16 sensors when two different state-of-the-art EVS are deployed. Our experiments demonstrate that 71% of their physical fingerprints are vulnerable to evasion. By incorporating our approach, they build robust physical event fingerprints, and thus, properly mitigate realistic attack vectors.



## Contributions

* 提出了一种算法，通过分析物理事件指纹(event fingerprints)是否能被其他事件的影响所包含或掩盖，来发现可逃避的fingerprints。
* 针对躲避攻击(Evasion Attack)，作者开发了两种防御方案，即EVS software patching和sensor location patching。Software patching是将新的物理指纹引入EVS的一种自动化方法。Sensor location patching是一种基于设计的安全(security-by-design)方法，与Software patching互补，它生成传感器位置，确保物理指纹对一个事件是唯一的。
* 通过部署在两个智能家庭中的两个独立的EVS评估作者的防御能力，这两个EVS共有12个actuator和16个sensor。作者的评估表明，71%的物理指纹容易受到Evasion Attack，作者的系统可以成功地阻止所有的攻击。
* 作者实验的系统发布在了[github](https://github.com/purseclab/EVS_Evasion)。<u>（目前好像是不能看，404了）</u>



## Background

### Event Spoofing and Masking Attacks

智能家居通常会有一个IoT hub作为控制中心，其能掌控着所有的IoT设备。在这里我们主要考虑两个部分：sensors和actuators。

* sensor: 该器件会周期性的测量物理通道，并输出（记录）下物理通道的数值（这个数值有两种，一个是读数，还有一个是bool型的变量如开/关）；
* actuators: 负责执行命令，从而对物理通道产生影响。

在本文中，event的定义是：通过物联网应用程序触发的执行器状态变化，即用户与执行器的直接物理交互或者配套应用程序和虚拟助手等用户界面。

先前的研究中发现智慧家居对于event spoofing和masking这两种攻击方式是脆弱的：

* Event Spoofing: 攻击者伪造某个event发生，但实际上没有发生；
* Masking: 攻击者掩盖某个event的发生，即event实际上发生了，但是被攻击者掩盖了；

以上两种攻击方式最终会造成<u>物理实际</u>和<u>IoT hub保存状态</u>的不一致。



### Event Verification System（EVS）

为了对上述的攻击进行防护，先前有研究提出了EVS系统，该系统利用fingerprint进行保护。根据如何生成fingerprints，系统可以分为两种类型：Rule-based EVS(R-EVS)和ML-based EVS(ML-EVS)。这两个类型的EVS都分为如下图两个阶段：

![image-20221114151450767](C:\Users\Nirvana\AppData\Roaming\Typora\typora-user-images\image-20221114151450767.png)

1. **Physical Fingerprint Extraction.**这个阶段EVS需要收集每一个event对应的sensor的读数。

   * R-EVS: 以event(E)及其对sensor读数(S)的影响之间的统计相关性的形式从收集到的trace中提取规则，如`Rule: light-on --- {S1.Illum = High, S2.Illum = High}`。考虑到读数可能会受到环境的影响，直接用读数作为rule中的一部分会很冗杂，R-EVS经常将数值传感器测量映射为二元(如high/low或increase/decrease)，或者映射到几种类别(如high/medium/low)。
   * ML-EVS: 对每个event利用从sensor读数中提取的feature学习出一个模型。比如对于`light-on`这个event，提取光线传感器中的feature(max, mean, sum, stdev)进行学习。同样为了考虑环境噪声的影响，ML-EVS使用smoothing filters和signal processing(如moving averavge)的方式来降低噪声影响。

2. **Physical Fingerprint Checking.**EVS最终是使用刚刚形成的fingerprint进行两种攻击检测，具体如下：

   * R-EVS: 当收到相应的event notification时检查是否符合相应的rule。

     如：为了检查spoofing，当收到了`light-on`消息时，R-EVS会检查光线传感器S1和S2的读数看是否受到攻击（如果读数有偏差，则认为实际上应该没有执行`light-on`，也就是遭到了spoofing）。为了检查masking，R-EVS会定期查看sensor的读数，如果S1、S2读数变成了High，但是没有收到`light-on`的消息，则会认为是masking attack。

   * ML-EVS: 为了检查spoofing，ML-EVS根据学习到的事件模型，从运行时传感器读数预测物理事件是否发生。如果收到通知，但模型预测这个事件没有发生，则认为是spoofing；为了检查masking，他们持续从传感器读数中提取特征。如果事件模型预测发生了一个物理事件，但是没有收到它的通知，则认为是masking。



## Threat Model

### EVS Threat Model

在EVS的威胁模型中，他们假设攻击者可以实施的攻击有:event spoofing和event masking。攻击者可以通过(1) 影子设备（即用程序模拟真实设备，使得攻击者能够使用从真实设备偷来的credential远程与IoT hub进行通讯。偷取方式：官网上公开的数据或者是脆弱的IoT APP）和(2) 病毒App（这个APP可以利用物联网编程框架中的设计漏洞，不注入命令对物理设备控制，而是偷偷地执行spoofing或masking）。