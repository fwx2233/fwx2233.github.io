---
layout: post
title: IoTSEER
tags: [p]
author: author1
---

# Discovering IoT Physical Channel Vulnerabilities

一篇检测物理通道(Physical Channel)交互是否会产生非预期行为的文章，[原文链接](https://arxiv.org/abs/2102.01812)



## Imformation

**Author:** Muslum Ozgur Ozmen[1], Xuansong Li[2], Andrew Chu[3], Z. Berkay Celik[1], Bardh Hoxha[4], Xiangyu Zhang[1]

**Company**: [1]Purdue University, [2]School of Computer Science and Engineering, Nanjing University of Science and Technology, [3]University of Chicago, [4]Toyota Research Institute North America

**Publisher**: ACM CCS	

**Year**: 2022



## Abstract

&emsp;Smart homes contain diverse sensors and actuators controlled by IoT apps that provide custom automation. Prior works showed that an adversary could exploit physical interaction vulnerabilities among apps and put the users and environment at risk, e.g., to break into a house, an adversary turns on the heater to trigger an app that opens windows when the temperature exceeds a thresh old. Currently, the safe behavior of physical interactions relies on either app code analysis or dynamic analysis of device states with manually derived policies by developers. However, existing works fail to achieve sufficient breadth and fidelity to translate the app code into their physical behavior or provide incomplete security policies, causing poor accuracy and false alarms.

&emsp;In this paper, we introduce a new approach, IoTSeer, which ef ficiently combines app code analysis and dynamic analysis with new security policies to discover physical interaction vulnerabili ties. IoTSeer works by first translating sensor events and actuator commands of each app into a physical execution model (PeM) and unifying PeMs to express composite physical execution of apps (CPeM). CPeM allows us to deploy IoTSeer in different smart homes by defining its execution parameters with minimal data collection. IoTSeer supports new security policies with intended/unintended physical channel labels. It then efficiently checks them on the CPeM via falsification, which addresses the undecidability of verification due to the continuous and discrete behavior of IoT devices.

&emsp;We evaluate IoTSeer in an actual house with 14 actuators, six sensors, and 39 apps. IoTSeer discovers 16 unique policy violations, whereas prior works identify only 2 out of 16 with 18 falsely flagged violations. IoTSeer only requires 30 mins of data collection for each actuator to set the CPeM parameters and is adaptive to newly added, removed, and relocated devices.



## Contributions

* **Translating App Source Code into its Physical Behavior**: We translate the actuation commands and sensor events in the app source code into physical execution models to define their physical behavior.
* **Composition of Interacting Apps**: We introduce a novel composite physical execution model architecture that defines the joint physical behavior of interacting apps.
* **Physical Channel Policy Validation**: We develop new security policies with intended/unintended physical channel labels. We formally validate the policies on CPeM through optimization-guided falsification.
* **Evaluation in an Actual House**: We use IoTSeer in a real house containing 14 actuators and six sensors and expose 16 physical channel policy violations.
* IoTSeer code is available at [github](https://github.com/purseclab/IoTSeer) for public use and validation.



## Design Challenges

1. **Correct Physical Interactions.** 

   以前的方法：使用NLP技术，或者人工判断的方式。如：`heater-on`映射到温度通道。但是这些方法会发现错误的相互作用，或者由于物理通道属性的过度近似和过低近似而无法发现它们，会产生隐患，如：当用户不在家时，他们没有阻止`door-unlock`或错误地批准`window-open`。

2. **Unintended Physical Interactions.**

   之前的工作基于设备的用例定义安全规则，以防止物理交互漏洞。但是这些规则不考虑意外交互，这些交互发生在设备和应用程序的预期使用之外，并在智能家居中意外触发动作。如：

   <img src="../Images/image-20221107181651585.png" alt="image-20221107181651585" style="zoom:50%;" />

3. **Run-time Dilemmas.** 

   在运行时检查设备状态的动态系统不能推断出一个确切的命令对物理通道的影响。

4. **Device Placement Sensitivity.** 

   先前的工作没有模拟actuator和sensor之间的距离对物理相互作用的影响。直观地说，如果actuator和sensor之间的距离增加，命令对传感器读数的物理影响会单调地减小。



## IoTSEER Design

![image-20221107182918598](../Images/image-20221107182918598.png)

整体思路：为IoT的App进行建模，形成Physical Execution Model(PEM) --> 多个PEM结合，形成Composite Physical Execution Model(CPEM) --> 给CPEM设置相关参数 --> 建立物理通道应当满足的规则 --> 利用设置好参数的CPEM检测，看是否违反相关规则。



### Generic Offline Module

1. **Static App Analysis**

   目的：需要应用程序的事件(event)、驱动命令(actuation command)和与每个命令关联的触发条件(trigger condition)。

   挑战：物联网平台是多样化的，每个平台都为自动化提供了不同的编程语言。

   解决方法：利用现有的物联网应用静态分析和解析工具（原文参考文献16,17,61）。这些工具可以模拟应用程序的生命周期，从程序间控制流图( interprocedural control flow graph, ICFG)包括入口点和事件句柄。同时还能提取出：

   1. 设备和事件；
   2. 每个事件会执行的动作(actuation)；
   3. 执行动作的条件；

   例如：从`When the temperature is higher than 80° 𝐹, if the AC is off, then open the window`中IotSEER可以获取到event:`temp > 80`，command:`window-open`，trigger condition:`AC-off`。

2. **Constructing PEMs**

   目的：构建对应的PEM

   解决方法：将应用程序的每个command和sensor event转换为用混合I/O自动机表示的PeM，该过程首先为命令影响的每个物理通道构建单独的PeM，并通过基于物理的建模观察传感器事件。基于物理的建模将控制理论中的通用微分或代数方程集成到PeM中，以建模每个应用程序的物理行为。这种方法被广泛应用于机器人车辆(例如，预测RV的传感器值)和自动驾驶车辆(例如，建模汽车和行人的运动）。

   初始时，IoTSEER会认为每个命令可能会影响所有物理通道，并之后在特定于部署的模块中删除过度近似的通道

   * **PEMs for Actuation Commands**：command PEM定义了命令的离散动态和连续动态。离散行为是执行器用于从应用程序调用命令的状态(例如，开/关)。连续行为是定义其物理行为的代数或微分方程。形式化定义为`Ha = (Q, X, f, ->, U, O)`，其中Q是一组离散的状态（比如开、关）；X是连续的变量（比如温度、音量）；f是flow function，表示连续变量的演化；`->`定义离散转换；U/O表示输入/输出的变量。最终Ha的输出是对应命令产生的影响。

     flow function:作者为每个物理通道定义一个单独的通用流函数。它们是连续物理通道(如温度)的微分方程和瞬时通道(如声音)的代数方程。流函数以两个参数作为输入，器件属性(device property)和到执行器的距离(distance from the actuator)，并输出执行器在该距离上对物理通道的影响。

     **关于流函数的两个参数如何确定，将在后续的步骤介绍**

   * **PEMs for Sensor Events**：作者将事件的PeM定义为混合单状态的I/O自动机(with single state)，Q={on}，并且每经过时间t（传感器对其测量数据采样的频率）就会产生一次自跃迁。

     <img src="../Images/image-20221107194858843.png" alt="image-20221107194858843" style="zoom:65%;" />

     Sensor Event PEM接受一个灵敏度级别参数，该参数定义物理通道中的最小更改量(threshold)，以改变传感器的读数。阈值函数输出传感器读数，指示物理通道水平是否等于或大于灵敏度水平。如果传感器测量布尔类型的值(例如，是否运动)，PeM输出一个位表示“检测到”或“未检测到”事件；如果传感器进行数值读数(如温度)，则输出数值。

   最终，作者利用以上的方式在IoTSEER中集成了总共24个Command PEM(例如，`heater-on`，`door-unlock`)，它们影响总共6个物理通道，即temperature、humidity、illuminance、sound、motion和smoke，以及6个测量这些通道对应的Sensor Event PEM。

   优点：可以很容易地扩展PEM以定义各种设备的物理行为，因为它们的流函数对于影响相同物理通道的一系列设备是通用的。

3. **Unifying the Physical Behavior of Apps**（Constructing CPEM）

   算法伪代码如下：

   <img src="../Images/image-20221107195936185.png" alt="image-20221107195936185" style="zoom:50%;" />

   该算法首先通过匹配Sensor Event和命令的物理通道来识别交互应用程序。

   * 首先，如果传感器测量命令影响的物理通道，则添加从Command EeM (Ha)输出到Sensor Event PEM (Hs)输入的转换(第2-4行)。
   * 其次，软件(software)和物理通道可以触发应用程序的事件处理程序，并在满足应用程序的条件时调用命令。
     * 对于物理通道，作者添加了从Sensor Event PEM (Hs)到Commend PEM (Ha)的转换(第5-12行)。
     * 对于软件通道，如果应用程序在a1发生时调用a2，则添加从Command PEM (Ha1)到另一个Commad PEM (Ha2)的转换(第13-17行)。

   以上的转换操作用`UNIFY()`操作符表示，其中包括的转换方式有：<img src="../Images/image-20221107200730271.png" alt="image-20221107200730271" style="zoom:38%;" />，其中<img src="../Images/image-20221107200806864.png" alt="image-20221107200806864" style="zoom:50%;" />是物理通道上的影响，<img src="../Images/image-20221107200834057.png" alt="image-20221107200834057" style="zoom:50%;" />是软件通道。

   一个例子：

   ![image-20221107201127471](../Images/image-20221107201127471.png)

   当App4和App5中的指令启动后，会产生如下转换

   ![image-20221107201159311](../Images/image-20221107201159311.png)

   而温度的升高又会对App6产生影响，即如下转换：

   ![image-20221107201233581](../Images/image-20221107201233581.png)

   

   **难点：解决聚合和依赖关系**

   解决方法：传感器可以测量多个命令的累积影响。为此，作者定义了一个聚合运算符(AGG)，它组合了`UNIFY(Ha, Hs)`操作符，以便Sensor Event PEM将Command PEM的聚合输出作为输入(第18-19行)。还是以上面的例子说明，App4和App5的转换可以改写为

   <img src="../Images/image-20221107201532579.png" alt="image-20221107201532579" style="zoom:80%;" />

   AGG运算符的输出是基于物理通道的单位定义的：

   * 对于线性范围的通道（如温度），其输出为Command PEM输出的求和；
   * 对于log范围的通道（如音量），其输出将会转换成线性后进行聚合，即<img src="../Images/image-20221107201808794.png" alt="image-20221107201808794" style="zoom:40%;" />

   与此同时，物理通道的另一个特性是物理通道(pj)可能取决于另一个通道(pi)（例如，当环境温度升高时，空气-水容量增加，影响湿度传感器的读数）。如果pi的变化影响pj，一个Sensor Event PEM的输出可能会影响另一个Sensor Event PEM的读数。Generic PEM允许我们轻松地识别依赖性，通过迭代获取每个Sensor Event PEM并检查它是否用于另一个Sensor Event的阈值函数(第20-23行)。为了解决这个问题，作者使用<img src="../Images/image-20221107202240990.png" alt="image-20221107202240990" style="zoom:45%;" />表示从温度传感器的PEM输出到湿度传感器PEM的输入转换。



### **Deployment-specific Module**

需要设置具体的设备参数，以确保CPEM精确模拟应用程序的物理行为。根据上一节所述，具体的参数有两个：设备的特征值和距离。

1. **Setting the Device Property Parameter**

   作者基于已安装的设备设置设备属性参数有两个方法。

   * 第一种方法是使用已安装设备的数据表。然而，在原型实现中，作者意识到数据表可能是不完整的，或者可能出现差异，比如设备老化。

   * 第二种方法是使用System Identification(SI)，这是一种基于学习的方法，通常由控制工程师使用实验数据轨迹来估计物理过程的参数或模型。

     > 这一部分是真没看懂

     为了将这种方法应用到智能家居中，iotser单独激活每个执行器并收集传感器测量数据。接下来，它运行带有设备属性参数的pem，并获得传感器轨迹。它计算(𝜏，𝜖)实际设备和PeM轨迹之间的紧密度。它对设备属性参数进行二分搜索，以获得使偏差评分最小的最优值。使用真实的设备轨迹来确定设备属性参数，保证了环境条件的影响(例如，家具)的传感器读数集成到CPeM中。从收集到的实际设备轨迹中，iotser还可以确定一个命令在智能家居中影响的物理通道集。iotser检查一个命令是否不会改变传感器测量值，或者它的影响是否在统计上与环境噪声难以区分。在这种情况下，iotser从CPeM中删除这些命令的pem

2. **Setting the Distance Parameter**

   IoTSEER使用接收信号的强度(RSSI)的距离估计技术，这种技术利用距离和RSSI的反比来估计两个设备之间的距离。尽管这种方法可能会在距离参数中产生误差，但作者的评估表明，这种误差对IoTSEER的policy violation识别的影响是很小的。





###  **Security Analysis Module**
