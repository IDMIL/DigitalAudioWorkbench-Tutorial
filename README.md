# Digital Audio Workbench 2

By Arden Butterfield, Josh Rohs, Travis J. West & Marcelo M. Wanderley
with contributions by Laurent Tarabout

Copyright CIRMMT/McGill University, 2026, based on IDMIL's [Digital Audio Workbench]
(https://idmil.github.io/DigitalAudioWorkbench/).

Sampling, quantization, antialiasing, and delta-sigma modulation are interrelated topics with applications in digital
audio. In these workbenches, we aim to provide a playground that helps students gain intuitive understanding of these
topics, by letting students both see and hear the consequences of their choices of sampling rate, delta-sigma step, or 
filter order on a variety of test signals.

## Overview of Modules

Unlike the original Digital Audio Workbench, this version separates the process into modules, each with its own
parameters and visualizations. The signal can be thought of as cascading through the modules in order, and can be
listened to at multiple steps along the way.

### Input Module

Aliasing artifacts created by sampling and quantization are highly dependent on the frequency and timbre of the input
signal, so a variety of signal parameters are provided to the user. Input signals include alias-free saw waves, square
waves, and triangle waves, a variety of other tones generated through additive synthesis, as well as 