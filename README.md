/*
<!-- note to maintainers:

This document serves as both the README for the project and as the source
code for the heart of the simulation. This is done since certain aspects of the
documentation of the project can only be adequately precise by including source
code inline; rather than duplicate the code across the documentation page and
the source document, they are kept together in one place. As such, the prose
block at the beginning and the code block at the end are carefully enclosed in
interlocking delimiters so that javascript ignores the README text and the
README pretty-prints the javascript source. Take care not to disturb these
block delimeters.

Futhermore, take care to limit the scope of the source code in this document
to only that which is essential for understanding the core of the simulation.

-->

# The Digital Audio Workbench

https://idmil.gitlab.io/course-materials/mumt203/interactive-demos 

## Introduction

The purpose of the digital audio workbench is to illustrate key concepts in
digital audio theory with interactive visualizations of each stage of the
analog-to-digial conversion (ADC) and digital-to-analog conversion (DAC)
processes.  These visualizations are inspired by demonstrations using
oscilloscopes and spectrum analyzers to compare the analog signal input into
the ADC process with the analog signal output by the DAC process, e.g.
https://youtu.be/cIQ9IXSUzuM

By experimenting with the settings of the simulation, numerous key concepts in
digital signal theory can be nicely illustrated, such as aliasing, quantization
error, critical sampling, under and oversampling, and many others.  The
interactive interface allows the simulation to be explored freely; users can
examine the signals both visually through numerous graphs, or by listening to
the test signals directly.



