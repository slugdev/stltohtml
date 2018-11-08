PROJECT (stltohtml)

SET(stltohtml_SRC
main.cpp)
ENABLE_TESTING()

set (CMAKE_CXX_STANDARD 11)

ADD_EXECUTABLE (stltohtml ${stltohtml_SRC})

ADD_TEST(
	NAME cat_dish
	COMMAND stltohtml cat_dish.stl cat_dish.html
	WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/test"
)

ADD_TEST(
	NAME bucket
	COMMAND stltohtml bucket.stl bucket.html
	WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/test"
)

ADD_TEST(
	NAME cat_dish_bin
	COMMAND stltohtml cat_dish_bin.stl cat_dish_bin.html
	WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/test"
)

ADD_TEST(
	NAME single_tri
	COMMAND stltohtml single_tri.stl single_tri.html
	WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/test"
)

ADD_TEST(
	NAME single_tri_blue
	COMMAND stltohtml single_tri.stl single_tri_blue.html color 0 0 1
	WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/test"
)

INSTALL(TARGETS ${PROJECT_NAME} DESTINATION "bin/")

if(WIN32)
set(CPACK_GENERATOR WIX)
set(CPACK_PACKAGE_NAME "stltohtml")
set(CPACK_PACKAGE_VENDOR "slugdev")
set(CPACK_RESOURCE_FILE_LICENSE "${CMAKE_SOURCE_DIR}/LICENSE.txt")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "Command line utility to convert a stl file into a single html file.")
set(CPACK_PACKAGE_VERSION_MAJOR "1")
set(CPACK_PACKAGE_VERSION_MINOR "0")
set(CPACK_PACKAGE_VERSION_PATCH "0")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "${CMAKE_PROJECT_NAME}/${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}")
set(CPACK_WIX_UPGRADE_GUID "F9AEABB2-D7AF-4EA2-BF46-B3E135410D17")
include (InstallRequiredSystemLibraries)
include(CPack)
endif(WIN32)

