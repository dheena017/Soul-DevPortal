from setuptools import setup, find_packages

setup(
    name="workspace-config",
    version="2.0.0",
    description="Centralized configuration presets, design tokens, and canonical port registry for Workspace",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
